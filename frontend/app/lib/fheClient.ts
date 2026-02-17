import { ethers } from "ethers";
// Types — inferred from the SDK; no top-level import needed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FhevmInstance = any;

let instance: FhevmInstance | null = null;
let sdkReady = false;

/**
 * Lazily load the SDK bundle (which reads from window.relayerSDK set by the
 * CDN <script> in layout.tsx). The dynamic import() ensures this module is
 * never evaluated on the server.
 */
async function getSDK() {
  const sdk = await import("@zama-fhe/relayer-sdk/bundle");
  return sdk;
}

/**
 * Initialize the FHEVM client instance.
 *
 * 1. Calls `initSDK()` to load the TFHE WASM (served from the Zama CDN,
 *    loaded via the <script> tag in layout.tsx).
 * 2. Creates an FhevmInstance using SepoliaConfig + the user's wallet provider.
 *
 * Must be called once before any encryption operations.
 */
export async function initFHEVM(): Promise<FhevmInstance> {
  if (instance) {
    return instance;
  }

  const { initSDK, createInstance, SepoliaConfig } = await getSDK();

  // Step 1 — load WASM (idempotent; safe to call multiple times)
  if (!sdkReady) {
    await initSDK();
    sdkReady = true;
  }

  // Step 2 — create the FHE instance with the user's wallet as network provider
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet detected. Please install MetaMask.");
  }

  instance = await createInstance({
    ...SepoliaConfig,
    network: window.ethereum,
  });

  return instance;
}

/**
 * Get the current FHEVM instance.
 * @throws if not initialized
 */
export function getFHEVMInstance(): FhevmInstance {
  if (!instance) {
    throw new Error("FHEVM not initialized. Call initFHEVM() first.");
  }
  return instance;
}

/**
 * Encrypt a donation amount for submission via the cUSDT confidentialTransferAndCall.
 * Uses euint64 to match the ERC-7984 standard (which uses euint64 for all amounts).
 *
 * @param cUsdtAddress The deployed ConfidentialUSDT contract address
 * @param userAddress The donor's wallet address
 * @param amount The plaintext donation amount (uint64 integer, in token smallest unit)
 * @returns handle (bytes32) and inputProof (bytes) for confidentialTransferAndCall
 */
export async function encryptDonationAmount(
  cUsdtAddress: string,
  userAddress: string,
  amount: bigint,
): Promise<{ handle: Uint8Array; inputProof: Uint8Array }> {
  const fhevmInstance = getFHEVMInstance();

  const input = fhevmInstance.createEncryptedInput(cUsdtAddress, userAddress);
  input.add64(amount);
  const encrypted = await input.encrypt();

  return {
    handle: encrypted.handles[0],
    inputProof: encrypted.inputProof,
  };
}

/**
 * Decrypt the user's own encrypted cUSDT balance.
 * Uses userDecrypt which requires an EIP-712 signature from the user.
 *
 * @param balanceHandle The bytes32 handle from confidentialBalanceOf
 * @param cUsdtAddress The ConfidentialUSDT contract address
 * @param userAddress The user's wallet address
 * @param signer The ethers signer for creating the decryption signature
 * @returns The decrypted balance amount (in token smallest units)
 */
export async function decryptUserBalance(
  balanceHandle: string,
  cUsdtAddress: string,
  userAddress: string,
  signer: any, // ethers.JsonRpcSigner
): Promise<bigint> {
  const fhevmInstance = getFHEVMInstance();
  
  // Generate keypair for decryption
  const keyPair = (fhevmInstance as any).generateKeypair();
  
  // Create EIP-712 signature for user decryption
  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 365; // Signature valid for 1 year
  
  const eip712 = (fhevmInstance as any).createEIP712(
    keyPair.publicKey,
    [cUsdtAddress],
    startTimestamp,
    durationDays
  );
  
  // Sign the EIP-712 message
  const signature = await signer.signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message
  );
  
  // Convert handle to hex string if it's not already
  const handleHex = typeof balanceHandle === 'string' && balanceHandle.startsWith('0x')
    ? balanceHandle
    : `0x${Buffer.from(balanceHandle).toString('hex')}`;
  
  // Decrypt using userDecrypt
  const decrypted = await (fhevmInstance as any).userDecrypt(
    [{ handle: handleHex, contractAddress: cUsdtAddress }],
    keyPair.privateKey,
    keyPair.publicKey,
    signature,
    [cUsdtAddress],
    userAddress,
    startTimestamp,
    durationDays
  );
  
  // Extract the decrypted value
  let decryptedValue: number | bigint;
  
  if (decrypted && typeof decrypted === 'object' && !Array.isArray(decrypted)) {
    // Result is an object with handle as key
    const handleKeys = Object.keys(decrypted);
    if (handleKeys.length > 0 && handleKeys[0]) {
      const value = (decrypted as any)[handleKeys[0]];
      if (typeof value === 'string' && value.startsWith('0x')) {
        decryptedValue = BigInt(value);
      } else {
        decryptedValue = BigInt(value);
      }
    } else {
      // Try direct handle access
      const fallbackValue = (decrypted as any)[handleHex] || Object.values(decrypted)[0];
      decryptedValue = typeof fallbackValue === 'string' && fallbackValue.startsWith('0x')
        ? BigInt(fallbackValue)
        : BigInt(fallbackValue);
    }
  } else if (Array.isArray(decrypted) && decrypted.length > 0) {
    decryptedValue = BigInt(decrypted[0]);
  } else {
    decryptedValue = BigInt(decrypted);
  }
  
  return decryptedValue;
}

const MAX_UINT64 = 18_446_744_073_709_551_615n;

/**
 * Decrypt the on-chain burnt amount handle from an unwrap (UnwrapRequested event).
 * Use the returned value and proof to call finalizeUnwrap.
 * @param burntAmountHandle The bytes32 handle from UnwrapRequested (on-chain handle).
 * @returns Decrypted amount (in wrapped-token units, pass as uint64 to finalizeUnwrap) and the decryption proof.
 */
export async function publicDecryptUnwrapHandle(
  burntAmountHandle: string,
): Promise<{ decryptedValue: bigint; decryptionProof: string }> {
  const fhevmInstance = getFHEVMInstance();
  const handleHex =
    typeof burntAmountHandle === "string" && burntAmountHandle.startsWith("0x")
      ? burntAmountHandle
      : `0x${Buffer.from(burntAmountHandle).toString("hex")}`;

  const result = await (fhevmInstance as any).publicDecrypt([handleHex]);

  let decryptedValue: bigint;
  if (result && typeof result === "object" && result.clearValues && typeof result.clearValues === "object") {
    const clearValues = result.clearValues as Record<string, number | bigint | string>;
    const keys = [
      handleHex,
      burntAmountHandle,
      handleHex.toLowerCase(),
      handleHex.toUpperCase(),
      handleHex.replace(/^0x/, ""),
    ];
    let found: number | bigint | string | undefined;
    for (const k of keys) {
      if (clearValues[k] !== undefined) {
        found = clearValues[k];
        break;
      }
    }
    if (found === undefined) found = Object.values(clearValues)[0];
    if (found === undefined || found === null)
      throw new Error("Could not find decrypted value in publicDecrypt result");
    decryptedValue = typeof found === "string" && found.startsWith("0x") ? BigInt(found) : BigInt(found);
  } else if (Array.isArray(result) && result.length > 0) {
    decryptedValue = BigInt(result[0]);
  } else {
    throw new Error("Invalid publicDecrypt result for unwrap handle");
  }

  if (decryptedValue > MAX_UINT64) throw new Error("Decrypted value exceeds uint64 max");

  let decryptionProof: string;
  if (result.decryptionProof) {
    decryptionProof =
      typeof result.decryptionProof === "string"
        ? result.decryptionProof
        : ethers.hexlify(
            result.decryptionProof instanceof Uint8Array
              ? result.decryptionProof
              : Buffer.from(result.decryptionProof),
          );
  } else {
    throw new Error("Decryption proof missing from publicDecrypt result");
  }

  return { decryptedValue, decryptionProof };
}
