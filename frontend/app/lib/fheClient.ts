import { createInstance, FhevmInstance } from "@fhevm/js";

let instance: FhevmInstance | null = null;

/**
 * Initialize the FHEVM client instance
 * Must be called once before any encryption operations
 */
export async function initFHEVM(): Promise<FhevmInstance> {
  if (instance) {
    return instance;
  }

  instance = await createInstance({
    networkUrl: process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545",
    gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:7077",
  });

  return instance;
}

/**
 * Get the current FHEVM instance
 * @throws if not initialized
 */
export function getFHEVMInstance(): FhevmInstance {
  if (!instance) {
    throw new Error("FHEVM not initialized. Call initFHEVM() first.");
  }
  return instance;
}

/**
 * Encrypt a donation amount for submission to the CovalentFund contract.
 * Uses the createEncryptedInput pattern matching the smart contract's
 * externalEuint32 + inputProof signature.
 *
 * @param contractAddress The deployed CovalentFund contract address
 * @param userAddress The donor's wallet address
 * @param amount The plaintext donation amount (uint32 integer)
 * @returns handle (bytes32) and inputProof (bytes) for contract call
 */
export async function encryptDonationAmount(
  contractAddress: string,
  userAddress: string,
  amount: number,
): Promise<{ handle: string; inputProof: string }> {
  const fhevmInstance = getFHEVMInstance();

  const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
  input.add32(amount);
  const encrypted = input.encrypt();

  return {
    handle: encrypted.handles[0],
    inputProof: encrypted.inputProof,
  };
}
