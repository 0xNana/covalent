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

const FAUCET_ABI = [
  "function drip() external",
  "function timeUntilNextDrip(address account) external view returns (uint256)",
  "function DRIP_AMOUNT() external view returns (uint256)",
  "function COOLDOWN() external view returns (uint256)",
  "function lastDrip(address) external view returns (uint256)",
  "event Drip(address indexed recipient, uint256 amount, uint256 timestamp)",
];

const CUSDT_ABI = [
  "function wrap(address to, uint256 amount) external",
  "function unwrap(address from, address to, bytes32 encryptedAmount, bytes inputProof) external",
  "function finalizeUnwrap(bytes32 burntAmount, uint64 burntAmountCleartext, bytes decryptionProof) external",
  "function confidentialTransferAndCall(address to, bytes32 encryptedAmount, bytes inputProof, bytes data) external returns (bytes32)",
  "function confidentialBalanceOf(address account) external view returns (bytes32)",
  "function underlying() external view returns (address)",
  "function rate() external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "event UnwrapRequested(address indexed receiver, bytes32 amount)",
];

// ---------------------------------------------------------------------------
// Contract addresses from env
// ---------------------------------------------------------------------------

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const CUSDT_ADDRESS = process.env.NEXT_PUBLIC_CUSDT_ADDRESS ?? "";
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS ?? "";
const FAUCET_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_ADDRESS ?? "";

if (typeof window !== "undefined") {
  if (!CONTRACT_ADDRESS) {
    console.warn("[Covalent] NEXT_PUBLIC_CONTRACT_ADDRESS is not set.");
  }
  if (!CUSDT_ADDRESS) {
    console.warn("[Covalent] NEXT_PUBLIC_CUSDT_ADDRESS is not set.");
  }
  if (!USDT_ADDRESS) {
    console.warn("[Covalent] NEXT_PUBLIC_USDT_ADDRESS is not set.");
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
  const usdtAddress = getUsdtAddress();
  
  // Validate that the contract has code deployed
  const code = await provider.getCode(usdtAddress);
  if (!code || code === "0x") {
    throw new Error(
      `No contract found at USDT address ${usdtAddress}. ` +
      `Please check NEXT_PUBLIC_USDT_ADDRESS in your .env.local file. ` +
      `Make sure you're connected to the correct network.`
    );
  }
  
  const usdt = new ethers.Contract(usdtAddress, ERC20_ABI, provider);
  
  try {
    return await usdt.balanceOf(address);
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes("BAD_DATA") || errorMessage.includes("could not decode")) {
      throw new Error(
        `Failed to call balanceOf on USDT contract at ${usdtAddress}. ` +
        `The contract may not be an ERC-20 token or may not be deployed on this network. ` +
        `Original error: ${errorMessage}`
      );
    }
    throw error;
  }
}

export async function getUsdtAllowance(owner: string, spender: string): Promise<bigint> {
  const provider = getProvider();
  const usdtAddress = getUsdtAddress();
  
  // Validate that the contract has code deployed
  const code = await provider.getCode(usdtAddress);
  if (!code || code === "0x") {
    throw new Error(
      `No contract found at USDT address ${usdtAddress}. ` +
      `Please check NEXT_PUBLIC_USDT_ADDRESS in your .env.local file. ` +
      `Make sure you're connected to the correct network.`
    );
  }
  
  const usdt = new ethers.Contract(usdtAddress, ERC20_ABI, provider);
  
  try {
    return await usdt.allowance(owner, spender);
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes("BAD_DATA") || errorMessage.includes("could not decode")) {
      throw new Error(
        `Failed to call allowance on USDT contract at ${usdtAddress}. ` +
        `The contract may not be an ERC-20 token or may not be deployed on this network. ` +
        `Original error: ${errorMessage}`
      );
    }
    throw error;
  }
}

export async function approveUsdt(spender: string, amount: bigint): Promise<void> {
  const provider = getProvider();
  const usdtAddress = getUsdtAddress();
  
  // Validate that the contract has code deployed
  const code = await provider.getCode(usdtAddress);
  if (!code || code === "0x") {
    throw new Error(
      `No contract found at USDT address ${usdtAddress}. ` +
      `Please check NEXT_PUBLIC_USDT_ADDRESS in your .env.local file. ` +
      `Make sure you're connected to the correct network.`
    );
  }
  
  const signer = await provider.getSigner();
  const usdt = new ethers.Contract(usdtAddress, ERC20_ABI, signer);
  
  try {
    const tx = await usdt.approve(spender, amount);
    await tx.wait();
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes("BAD_DATA") || errorMessage.includes("could not decode")) {
      throw new Error(
        `Failed to call approve on USDT contract at ${usdtAddress}. ` +
        `The contract may not be an ERC-20 token or may not be deployed on this network. ` +
        `Original error: ${errorMessage}`
      );
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// cUSDT helpers (ERC-7984 shielder)
// ---------------------------------------------------------------------------

export async function getCUsdtInferredBalance(address: string): Promise<bigint> {
  const provider = getProvider();
  const cUsdt = new ethers.Contract(getCUsdtAddress(), CUSDT_ABI, provider);
  // inferredTotalSupply gives the shielder's total; for individual balance we check underlying
  // But ERC-7984 balances are encrypted — we can only check USDT held by the shielder
  // For the UI, we show the user's USDT balance + the shielder's total supply as a proxy
  return await cUsdt.inferredTotalSupply().catch(() => BigInt(0));
}

/**
 * Get the encrypted balance handle (bytes32) for a user's cUSDT balance.
 * This handle can be decrypted using userDecrypt with a signature.
 */
export async function getCUsdtBalanceHandle(address: string): Promise<string | null> {
  const provider = getProvider();
  const cUsdtAddress = getCUsdtAddress();
  const cUsdt = new ethers.Contract(cUsdtAddress, CUSDT_ABI, provider);
  
  try {
    // confidentialBalanceOf returns euint64, which ethers decodes as bytes32 (the underlying type)
    const handle = await cUsdt.confidentialBalanceOf(address);
    
    // Handle can be null/zero if balance is 0 or not initialized
    // euint64.unwrap() returns bytes32 (contract method name), and ethers should decode it as a string
    if (!handle || 
        handle === ethers.ZeroHash || 
        handle === "0x0000000000000000000000000000000000000000000000000000000000000000" ||
        handle === "0x") {
      return null;
    }
    
    // Ensure handle is a valid bytes32 string
    if (typeof handle !== "string" || !handle.startsWith("0x") || handle.length !== 66) {
      console.warn(`Unexpected handle format: ${handle}`);
      return null;
    }
    
    return handle;
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    // If balance is not initialized, contract might revert - return null
    if (errorMessage.includes("not initialized") || 
        errorMessage.includes("ZeroBalance") ||
        errorMessage.includes("BAD_DATA") ||
        errorMessage.includes("could not decode")) {
      return null;
    }
    throw error;
  }
}

export async function shieldUsdtToCUsdt(to: string, amount: bigint): Promise<void> {
  const provider = getProvider();
  const signer = await provider.getSigner();
  const cUsdt = new ethers.Contract(getCUsdtAddress(), CUSDT_ABI, signer);
  const tx = await cUsdt.wrap(to, amount); // Contract still uses wrap(), but we call it shield in UI
  await tx.wait();
}

/**
 * Unshield cUSDT back to USDT (step 1 of 2).
 * Burns the encrypted cUSDT, emits UnwrapRequested with the on-chain burnt amount handle.
 * Caller must then decrypt that handle and call finalizeUnshieldCUsdt to receive USDT.
 * @returns The transaction receipt (use parseBurntAmountHandleFromUnshieldReceipt to get the handle for decryption + finalize).
 */
export async function unshieldCUsdt(
  from: string,
  to: string,
  handle: Uint8Array,
  inputProof: Uint8Array,
): Promise<ethers.TransactionReceipt | null> {
  const provider = getProvider();
  const signer = await provider.getSigner();
  const cUsdt = new ethers.Contract(getCUsdtAddress(), CUSDT_ABI, signer);
  const tx = await cUsdt.unwrap(from, to, handle, inputProof, { gasLimit: 5_000_000 }); // Contract still uses unwrap(), but we call it unshield in UI
  const receipt = await tx.wait();
  return receipt;
}

/**
 * Parse the UnwrapRequested event from an unshield() transaction receipt.
 * The emitted handle is the on-chain burnt amount (must be used for publicDecrypt and finalizeUnshield).
 */
export function parseBurntAmountHandleFromUnshieldReceipt(
  cUsdtAddress: string,
  receipt: ethers.TransactionReceipt | null,
): string | null {
  if (!receipt || !receipt.logs?.length) return null;
  const cUsdtInterface = new ethers.Interface(CUSDT_ABI);
  const unwrapTopic = cUsdtInterface.getEvent("UnwrapRequested")?.topicHash;
  if (!unwrapTopic) return null;
  const log = receipt.logs.find((l) => l.topics[0] === unwrapTopic);
  if (!log) return null;
  const parsed = cUsdtInterface.parseLog({ topics: log.topics as string[], data: log.data });
  if (!parsed || parsed.name !== "UnwrapRequested") return null;
  const amount = parsed.args?.amount ?? parsed.args?.[1];
  if (typeof amount !== "string" || !amount.startsWith("0x")) return null;
  return amount;
}

/**
 * Finalize unshield (step 2 of 2). Call after unshield() and publicDecrypt of the burnt amount handle.
 * Transfers the underlying USDT to the recipient stored in the unshield request.
 */
export async function finalizeUnshieldCUsdt(
  burntAmountHandle: string,
  burntAmountCleartext: number,
  decryptionProof: string | Uint8Array,
): Promise<void> {
  const provider = getProvider();
  const signer = await provider.getSigner();
  const cUsdt = new ethers.Contract(getCUsdtAddress(), CUSDT_ABI, signer);
  const proofBytes =
    typeof decryptionProof === "string"
      ? decryptionProof
      : ethers.hexlify(decryptionProof instanceof Uint8Array ? decryptionProof : new Uint8Array(decryptionProof));
  const tx = await cUsdt.finalizeUnwrap(burntAmountHandle, burntAmountCleartext, proofBytes, {
    gasLimit: 5_000_000,
  });
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

// ---------------------------------------------------------------------------
// Faucet helpers
// ---------------------------------------------------------------------------

export function getFaucetAddress(): string {
  if (!FAUCET_ADDRESS) {
    throw new Error("Faucet address not configured. Set NEXT_PUBLIC_FAUCET_ADDRESS.");
  }
  return FAUCET_ADDRESS;
}

export function isFaucetConfigured(): boolean {
  return Boolean(FAUCET_ADDRESS);
}

export async function faucetDrip(): Promise<void> {
  const provider = getProvider();
  const signer = await provider.getSigner();
  const faucet = new ethers.Contract(getFaucetAddress(), FAUCET_ABI, signer);
  const tx = await faucet.drip();
  await tx.wait();
}

export async function faucetTimeUntilNextDrip(address: string): Promise<number> {
  const provider = getProvider();
  const faucet = new ethers.Contract(getFaucetAddress(), FAUCET_ABI, provider);
  return Number(await faucet.timeUntilNextDrip(address));
}
