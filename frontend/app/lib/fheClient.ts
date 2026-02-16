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
