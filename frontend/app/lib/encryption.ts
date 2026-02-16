import { encryptDonationAmount } from "./fheClient";
import { submitDonation as submitDonationToContract, getContractAddress } from "./contract";

/**
 * Encrypt and submit a donation to a fund.
 * Handles the full flow: validate -> encrypt client-side -> submit to contract.
 *
 * @param fundId The fund to donate to
 * @param amount The plaintext donation amount (positive integer)
 * @param userAddress The connected wallet address of the donor
 */
export async function encryptAndDonate(
  fundId: number,
  amount: number,
  userAddress: string,
): Promise<void> {
  if (amount <= 0 || !Number.isInteger(amount)) {
    throw new Error("Donation amount must be a positive integer");
  }
  if (amount > 4_294_967_295) {
    throw new Error("Donation amount exceeds maximum (uint32 limit)");
  }

  const contractAddress = getContractAddress();

  const { handle, inputProof } = await encryptDonationAmount(
    contractAddress,
    userAddress,
    amount,
  );

  await submitDonationToContract(fundId, handle, inputProof);
}
