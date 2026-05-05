import { encryptDonationAmount, initFHEVM } from "./fheClient";
import {
  getCUsdtAddress,
  approveUsdt,
  getUsdtAllowance,
  shieldUsdtToCUsdt,
  donateConfidential,
} from "./contract";

const MAX_UINT64 = 18_446_744_073_709_551_615n;

/**
 * Full donation flow: approve USDT -> shield to cUSDT -> encrypt -> donate.
 * Or use existing cUSDT balance if useExistingCUsdt is true.
 *
 * @param fundId The fund to donate to
 * @param amount The plaintext donation amount in token smallest units
 * @param userAddress The connected wallet address of the donor
 * @param onStep Callback for UI progress updates
 * @param useExistingCUsdt If true, use existing cUSDT balance instead of shielding USDT
 */
export async function encryptAndDonate(
  fundId: number,
  amount: bigint,
  userAddress: string,
  onStep?: (step: string) => void,
  useExistingCUsdt: boolean = false,
): Promise<void> {
  if (amount <= 0n) {
    throw new Error("Donation amount must be greater than zero.");
  }

  if (amount > MAX_UINT64) {
    throw new Error("Donation amount exceeds the supported uint64 limit.");
  }

  const cUsdtAddress = getCUsdtAddress();

  // Initialize FHEVM early (needed for both flows)
  onStep?.("Initializing encryption...");
  await initFHEVM();

  if (useExistingCUsdt) {
    // Flow: Use existing cUSDT balance
    // Step 1: Encrypt the donation amount (from existing balance)
    onStep?.("Encrypting donation amount from your private balance...");
    const { handle, inputProof } = await encryptDonationAmount(
      cUsdtAddress,
      userAddress,
      amount,
    );

    // Step 2: Donate via confidentialTransferAndCall
    // The contract will check if user has sufficient encrypted balance
    onStep?.("Submitting confidential donation...");
    await donateConfidential(fundId, handle, inputProof);
  } else {
    // Flow: Shield USDT first, then donate
    // Step 1: Check allowance and approve USDT to cUSDT shielder if needed
    onStep?.("Checking USDT allowance...");
    const currentAllowance = await getUsdtAllowance(userAddress, cUsdtAddress);
    if (currentAllowance < amount) {
      onStep?.("Approving USDT...");
      await approveUsdt(cUsdtAddress, amount);
    }

    // Step 2: Shield USDT → cUSDT
    onStep?.("Shielding USDT → cUSDT...");
    await shieldUsdtToCUsdt(userAddress, amount);

    // Step 3: Encrypt the donation amount
    onStep?.("Encrypting donation amount...");
    const { handle, inputProof } = await encryptDonationAmount(
      cUsdtAddress,
      userAddress,
      amount,
    );

    // Step 4: Donate via confidentialTransferAndCall
    onStep?.("Submitting confidential donation...");
    await donateConfidential(fundId, handle, inputProof);
  }
}
