import { encryptDonationAmount, initFHEVM } from "./fheClient";
import {
  getCUsdtAddress,
  approveUsdt,
  getUsdtAllowance,
  wrapUsdtToCUsdt,
  donateConfidential,
} from "./contract";

const MAX_UINT64 = 18_446_744_073_709_551_615n;
const USDT_DECIMALS = 6;

/**
 * Full donation flow: approve USDT -> wrap to cUSDT -> encrypt -> donate.
 * Or use existing cUSDT balance if useExistingCUsdt is true.
 *
 * @param fundId The fund to donate to
 * @param amount The plaintext donation amount (in human-readable USDT units, e.g. 100 = $100)
 * @param userAddress The connected wallet address of the donor
 * @param onStep Callback for UI progress updates
 * @param useExistingCUsdt If true, use existing cUSDT balance instead of wrapping USDT
 */
export async function encryptAndDonate(
  fundId: number,
  amount: number,
  userAddress: string,
  onStep?: (step: string) => void,
  useExistingCUsdt: boolean = false,
): Promise<void> {
  if (amount <= 0 || !Number.isInteger(amount)) {
    throw new Error("Donation amount must be a positive integer");
  }

  const rawAmount = BigInt(amount) * BigInt(10 ** USDT_DECIMALS);
  if (rawAmount > MAX_UINT64) {
    throw new Error("Donation amount exceeds maximum (uint64 limit)");
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
      rawAmount,
    );

    // Step 2: Donate via confidentialTransferAndCall
    // The contract will check if user has sufficient encrypted balance
    onStep?.("Submitting confidential donation...");
    await donateConfidential(fundId, handle, inputProof);
  } else {
    // Flow: Wrap USDT first, then donate
    // Step 1: Check allowance and approve USDT to cUSDT wrapper if needed
    onStep?.("Checking USDT allowance...");
    const currentAllowance = await getUsdtAllowance(userAddress, cUsdtAddress);
    if (currentAllowance < rawAmount) {
      onStep?.("Approving USDT...");
      await approveUsdt(cUsdtAddress, rawAmount);
    }

    // Step 2: Wrap USDT → cUSDT
    onStep?.("Wrapping USDT → cUSDT...");
    await wrapUsdtToCUsdt(userAddress, rawAmount);

    // Step 3: Encrypt the donation amount
    onStep?.("Encrypting donation amount...");
    const { handle, inputProof } = await encryptDonationAmount(
      cUsdtAddress,
      userAddress,
      rawAmount,
    );

    // Step 4: Donate via confidentialTransferAndCall
    onStep?.("Submitting confidential donation...");
    await donateConfidential(fundId, handle, inputProof);
  }
}
