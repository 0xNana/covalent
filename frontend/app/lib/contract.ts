import { ethers } from "ethers";

// ---------------------------------------------------------------------------
// ABIs
// ---------------------------------------------------------------------------

const COVALENT_FUND_ABI = [
  "function createFund(tuple(address recipient, uint256 startTime, uint256 endTime) config) external returns (uint256)",
  "function getFund(uint256 fundId) external view returns (tuple(uint256 id, address recipient, address creator, uint256 startTime, uint256 endTime, bool active, uint256 donationCount))",
  "function getEncryptedTotal(uint256 fundId, address token) external view returns (bytes32)",
  "function getRevealedTotal(uint256 fundId, address token) external view returns (uint256)",
  "function isTokenRevealed(uint256 fundId, address token) external view returns (bool)",
  "function getFundTokens(uint256 fundId) external view returns (address[])",
  "function requestReveal(uint256 fundId, address token) external",
  "function revealTotal(uint256 fundId, address token, uint256 decryptedTotal) external",
  "function withdraw(uint256 fundId, address token) external",
  "function isAdmin(uint256 fundId, address account) external view returns (bool)",
  "function addAdmin(uint256 fundId, address admin) external",
  "function whitelistToken(address token) external",
  "function isWhitelisted(address token) external view returns (bool)",
  "event FundCreated(uint256 indexed fundId, address indexed creator, address recipient, uint256 startTime, uint256 endTime)",
  "event DonationReceived(uint256 indexed fundId, address indexed token, address indexed donor, uint256 donationIndex, uint256 timestamp)",
  "event TotalRevealed(uint256 indexed fundId, address indexed token, uint256 total, address indexed revealer, uint256 timestamp)",
  "event Withdrawal(uint256 indexed fundId, address indexed token, address indexed recipient, uint256 amount, uint256 timestamp)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function mint(address to, uint256 amount) external",
];

const CUSDT_ABI = [
  "function wrap(address to, uint256 amount) external",
  "function unwrap(address from, address to, bytes32 encryptedAmount, bytes inputProof) external",
  "function finalizeUnwrap(bytes32 burntAmount, uint64 burntAmountCleartext, bytes decryptionProof) external",
  "function confidentialTransferAndCall(address to, bytes32 encryptedAmount, bytes inputProof, bytes data) external returns (bytes32)",
  "function underlying() external view returns (address)",
  "function rate() external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

// ---------------------------------------------------------------------------
// Contract addresses from env
// ---------------------------------------------------------------------------

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const CUSDT_ADDRESS = process.env.NEXT_PUBLIC_CUSDT_ADDRESS ?? "";
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS ?? "";

if (typeof window !== "undefined") {
  if (!CONTRACT_ADDRESS) {
    console.warn("[Covalent] NEXT_PUBLIC_CONTRACT_ADDRESS is not set.");
  }
  if (!CUSDT_ADDRESS) {
    console.warn("[Covalent] NEXT_PUBLIC_CUSDT_ADDRESS is not set.");
  }
}

// ---------------------------------------------------------------------------
// Fund metadata — stored client-side only (never on-chain)
// ---------------------------------------------------------------------------

export interface FundMetadata {
  title: string;
  description: string;
}

const METADATA_KEY = "covalent_fund_metadata";

function getMetadataStore(): Record<string, FundMetadata> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveFundMetadata(fundId: number, meta: FundMetadata): void {
  if (typeof window === "undefined") return;
  const store = getMetadataStore();
  store[String(fundId)] = meta;
  localStorage.setItem(METADATA_KEY, JSON.stringify(store));
}

export function getFundMetadata(fundId: number): FundMetadata | null {
  const store = getMetadataStore();
  return store[String(fundId)] ?? null;
}

// ---------------------------------------------------------------------------
// Provider / contract helpers
// ---------------------------------------------------------------------------

function getProvider(): ethers.BrowserProvider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet detected. Please install MetaMask.");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

async function getSignedContract(): Promise<ethers.Contract> {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS.");
  }
  const provider = getProvider();
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, COVALENT_FUND_ABI, signer);
}

function getReadContract(): ethers.Contract {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS.");
  }
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, COVALENT_FUND_ABI, provider);
}

export function getContractAddress(): string {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS.");
  }
  return CONTRACT_ADDRESS;
}

export function getCUsdtAddress(): string {
  if (!CUSDT_ADDRESS) {
    throw new Error("cUSDT address not configured. Set NEXT_PUBLIC_CUSDT_ADDRESS.");
  }
  return CUSDT_ADDRESS;
}

export function getUsdtAddress(): string {
  if (!USDT_ADDRESS) {
    throw new Error("USDT address not configured. Set NEXT_PUBLIC_USDT_ADDRESS.");
  }
  return USDT_ADDRESS;
}

// ---------------------------------------------------------------------------
// ERC-20 helpers (USDT)
// ---------------------------------------------------------------------------

export async function getUsdtBalance(address: string): Promise<bigint> {
  const provider = getProvider();
  const usdt = new ethers.Contract(getUsdtAddress(), ERC20_ABI, provider);
  return await usdt.balanceOf(address);
}

export async function getUsdtAllowance(owner: string, spender: string): Promise<bigint> {
  const provider = getProvider();
  const usdt = new ethers.Contract(getUsdtAddress(), ERC20_ABI, provider);
  return await usdt.allowance(owner, spender);
}

export async function approveUsdt(spender: string, amount: bigint): Promise<void> {
  const provider = getProvider();
  const signer = await provider.getSigner();
  const usdt = new ethers.Contract(getUsdtAddress(), ERC20_ABI, signer);
  const tx = await usdt.approve(spender, amount);
  await tx.wait();
}

// ---------------------------------------------------------------------------
// cUSDT helpers (ERC-7984 wrapper)
// ---------------------------------------------------------------------------

export async function getCUsdtInferredBalance(address: string): Promise<bigint> {
  const provider = getProvider();
  const cUsdt = new ethers.Contract(getCUsdtAddress(), CUSDT_ABI, provider);
  // inferredTotalSupply gives the wrapper's total; for individual balance we check underlying
  // But ERC-7984 balances are encrypted — we can only check USDT held by the wrapper
  // For the UI, we show the user's USDT balance + the wrapper's total supply as a proxy
  return await cUsdt.inferredTotalSupply().catch(() => BigInt(0));
}

export async function wrapUsdtToCUsdt(to: string, amount: bigint): Promise<void> {
  const provider = getProvider();
  const signer = await provider.getSigner();
  const cUsdt = new ethers.Contract(getCUsdtAddress(), CUSDT_ABI, signer);
  const tx = await cUsdt.wrap(to, amount);
  await tx.wait();
}

/**
 * Unwrap cUSDT back to USDT (step 1 of 2).
 * Burns the encrypted cUSDT and requests decryption.
 * Must be followed by `finalizeUnwrap()` after the relayer decrypts.
 */
export async function unwrapCUsdt(
  from: string,
  to: string,
  handle: Uint8Array,
  inputProof: Uint8Array,
): Promise<void> {
  const provider = getProvider();
  const signer = await provider.getSigner();
  const cUsdt = new ethers.Contract(getCUsdtAddress(), CUSDT_ABI, signer);
  const tx = await cUsdt.unwrap(from, to, handle, inputProof);
  await tx.wait();
}

/**
 * Donate confidential tokens to a fund via confidentialTransferAndCall.
 * @param fundId The fund to donate to
 * @param handle Encrypted amount handle (bytes32)
 * @param inputProof The FHE input proof
 */
export async function donateConfidential(
  fundId: number,
  handle: Uint8Array,
  inputProof: Uint8Array,
): Promise<void> {
  const provider = getProvider();
  const signer = await provider.getSigner();
  const cUsdt = new ethers.Contract(getCUsdtAddress(), CUSDT_ABI, signer);
  const fundContractAddress = getContractAddress();

  const encodedFundId = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [fundId]);

  const tx = await cUsdt.confidentialTransferAndCall(
    fundContractAddress,
    handle,
    inputProof,
    encodedFundId,
    { gasLimit: 5_000_000 },
  );
  await tx.wait();
}

// ---------------------------------------------------------------------------
// Fund contract writes
// ---------------------------------------------------------------------------

/**
 * Create a new donation fund.
 * Only on-chain essentials go to the contract; title/description are saved to localStorage.
 */
export async function createFund(params: {
  title: string;
  description: string;
  recipient: string;
  startTime: number;
  endTime: number;
}): Promise<number> {
  const contract = await getSignedContract();
  const tx = await contract.createFund({
    recipient: params.recipient,
    startTime: params.startTime,
    endTime: params.endTime,
  });
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

  const fundId = Number(event.args.fundId);

  saveFundMetadata(fundId, {
    title: params.title,
    description: params.description,
  });

  return fundId;
}

/**
 * Request reveal of aggregated total for a specific token (admin only)
 */
export async function requestReveal(fundId: number, token?: string): Promise<void> {
  const contract = await getSignedContract();
  const tokenAddr = token || getCUsdtAddress();
  const tx = await contract.requestReveal(fundId, tokenAddr);
  await tx.wait();
}

/**
 * Withdraw confidential tokens from a closed fund (admin only)
 */
export async function withdrawFund(fundId: number, token?: string): Promise<void> {
  const contract = await getSignedContract();
  const tokenAddr = token || getCUsdtAddress();
  const tx = await contract.withdraw(fundId, tokenAddr);
  await tx.wait();
}

// ---------------------------------------------------------------------------
// Fund contract reads
// ---------------------------------------------------------------------------

export interface FundData {
  id: number;
  recipient: string;
  creator: string;
  startTime: number;
  endTime: number;
  active: boolean;
  donationCount: number;
  // Client-side metadata (may be null if viewed on a different device)
  title: string | null;
  description: string | null;
}

export async function getFund(fundId: number): Promise<FundData> {
  const contract = getReadContract();
  const f = await contract.getFund(fundId);
  const meta = getFundMetadata(fundId);

  return {
    id: Number(f.id),
    recipient: f.recipient,
    creator: f.creator,
    startTime: Number(f.startTime),
    endTime: Number(f.endTime),
    active: f.active,
    donationCount: Number(f.donationCount),
    title: meta?.title ?? null,
    description: meta?.description ?? null,
  };
}

/**
 * Get the encrypted total for a fund+token pair (returns bytes32 handle)
 */
export async function getEncryptedTotal(fundId: number, token?: string): Promise<string> {
  const contract = getReadContract();
  const tokenAddr = token || getCUsdtAddress();
  return await contract.getEncryptedTotal(fundId, tokenAddr);
}

/**
 * Get the revealed total for a fund+token pair
 */
export async function getRevealedTotal(fundId: number, token?: string): Promise<number> {
  const contract = getReadContract();
  const tokenAddr = token || getCUsdtAddress();
  return Number(await contract.getRevealedTotal(fundId, tokenAddr));
}

/**
 * Check if a fund+token pair has been revealed
 */
export async function isTokenRevealed(fundId: number, token?: string): Promise<boolean> {
  const contract = getReadContract();
  const tokenAddr = token || getCUsdtAddress();
  return await contract.isTokenRevealed(fundId, tokenAddr);
}

/**
 * Get list of tokens that have received donations for a fund
 */
export async function getFundTokens(fundId: number): Promise<string[]> {
  const contract = getReadContract();
  return await contract.getFundTokens(fundId);
}

/**
 * Check if an address is an admin of a fund
 */
export async function checkIsAdmin(fundId: number, address: string): Promise<boolean> {
  const contract = getReadContract();
  return await contract.isAdmin(fundId, address);
}
