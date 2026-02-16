import { ethers } from "ethers";

const COVALENT_FUND_ABI = [
  "function createFund(tuple(string title, string description, address recipient, uint256 startTime, uint256 endTime) config) external returns (uint256)",
  "function getFund(uint256 fundId) external view returns (tuple(uint256 id, string title, string description, address recipient, address creator, uint256 startTime, uint256 endTime, bool active, bytes32 encryptedTotal, uint256 donationCount, uint256 revealedTotal, bool revealed))",
  "function donate(uint256 fundId, bytes32 encryptedAmount, bytes inputProof) external",
  "function getEncryptedTotal(uint256 fundId) external view returns (bytes32)",
  "function requestReveal(uint256 fundId) external",
  "function revealTotal(uint256 fundId, uint256 decryptedTotal) external",
  "function withdraw(uint256 fundId) external",
  "function isAdmin(uint256 fundId, address account) external view returns (bool)",
  "function addAdmin(uint256 fundId, address admin) external",
  "event FundCreated(uint256 indexed fundId, address indexed creator, string title, address recipient, uint256 startTime, uint256 endTime)",
  "event DonationMade(uint256 indexed fundId, address indexed donor, uint256 donationIndex, uint256 timestamp)",
  "event TotalRevealed(uint256 indexed fundId, uint256 total, address indexed revealer, uint256 timestamp)",
  "event Withdrawal(uint256 indexed fundId, address indexed recipient, uint256 amount, uint256 timestamp)",
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

/**
 * Get a read-only contract instance (no signer needed)
 */
function getProvider(): ethers.BrowserProvider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet detected. Please install MetaMask.");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Get a contract instance connected to a signer for write operations
 */
async function getSignedContract(): Promise<ethers.Contract> {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS.");
  }
  const provider = getProvider();
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, COVALENT_FUND_ABI, signer);
}

/**
 * Get a read-only contract instance
 */
function getReadContract(): ethers.Contract {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS.");
  }
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, COVALENT_FUND_ABI, provider);
}

/**
 * Get the contract address
 */
export function getContractAddress(): string {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS.");
  }
  return CONTRACT_ADDRESS;
}

/**
 * Create a new donation fund
 */
export async function createFund(config: {
  title: string;
  description: string;
  recipient: string;
  startTime: number;
  endTime: number;
}): Promise<number> {
  const contract = await getSignedContract();
  const tx = await contract.createFund(config);
  const receipt = await tx.wait();

  const event = receipt.logs
    .map((log: ethers.Log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed: ethers.LogDescription | null) => parsed?.name === "FundCreated");

  if (!event) {
    throw new Error("FundCreated event not found in transaction receipt");
  }
  return Number(event.args.fundId);
}

/**
 * Get fund information
 */
export async function getFund(fundId: number): Promise<{
  id: number;
  title: string;
  description: string;
  recipient: string;
  creator: string;
  startTime: number;
  endTime: number;
  active: boolean;
  encryptedTotal: string;
  donationCount: number;
  revealedTotal: number;
  revealed: boolean;
}> {
  const contract = getReadContract();
  const fund = await contract.getFund(fundId);
  return {
    id: Number(fund.id),
    title: fund.title,
    description: fund.description,
    recipient: fund.recipient,
    creator: fund.creator,
    startTime: Number(fund.startTime),
    endTime: Number(fund.endTime),
    active: fund.active,
    encryptedTotal: fund.encryptedTotal,
    donationCount: Number(fund.donationCount),
    revealedTotal: Number(fund.revealedTotal),
    revealed: fund.revealed,
  };
}

/**
 * Submit an encrypted donation to a fund
 * @param fundId The fund to donate to
 * @param handle The encrypted amount handle (bytes32)
 * @param inputProof The input proof (bytes)
 */
export async function submitDonation(
  fundId: number,
  handle: string,
  inputProof: string,
): Promise<void> {
  const contract = await getSignedContract();
  const tx = await contract.donate(fundId, handle, inputProof, {
    gasLimit: 5_000_000,
  });
  await tx.wait();
}

/**
 * Get the encrypted total for a fund (returns bytes32 handle)
 */
export async function getEncryptedTotal(fundId: number): Promise<string> {
  const contract = getReadContract();
  return await contract.getEncryptedTotal(fundId);
}

/**
 * Request reveal of aggregated total (admin only)
 */
export async function requestReveal(fundId: number): Promise<void> {
  const contract = await getSignedContract();
  const tx = await contract.requestReveal(fundId);
  await tx.wait();
}

/**
 * Withdraw funds from a closed fund (admin only)
 */
export async function withdrawFund(fundId: number): Promise<void> {
  const contract = await getSignedContract();
  const tx = await contract.withdraw(fundId);
  await tx.wait();
}

/**
 * Check if an address is an admin of a fund
 */
export async function checkIsAdmin(fundId: number, address: string): Promise<boolean> {
  const contract = getReadContract();
  return await contract.isAdmin(fundId, address);
}
