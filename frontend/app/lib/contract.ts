import { ethers } from "ethers";

const COVALENT_FUND_ABI = [
  "function createFund(tuple(address recipient, uint256 startTime, uint256 endTime, uint256 goalAmount, string title, string description, string category) config) external returns (uint256)",
  "function getFund(uint256 fundId) external view returns (tuple(uint256 id, address recipient, address creator, uint256 startTime, uint256 endTime, bool active, uint256 donationCount, uint256 goalAmount, string title, string description, string category))",
  "function getFundCount() external view returns (uint256)",
  "function getEncryptedTotal(uint256 fundId, address token) external view returns (bytes32)",
  "function getRevealedTotal(uint256 fundId, address token) external view returns (uint256)",
  "function isTokenRevealed(uint256 fundId, address token) external view returns (bool)",
  "function isRevealRequested(uint256 fundId, address token) external view returns (bool)",
  "function getFundTokens(uint256 fundId) external view returns (address[])",
  "function owner() external view returns (address)",
  "function requestReveal(uint256 fundId, address token) external",
  "function revealTotal(uint256 fundId, address token, uint64 decryptedTotal, bytes decryptionProof) external",
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

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const CUSDT_ADDRESS = process.env.NEXT_PUBLIC_CUSDT_ADDRESS ?? "";
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS ?? "";
const FAUCET_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_ADDRESS ?? "";
const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

type ReadProvider = ethers.BrowserProvider | ethers.JsonRpcProvider;

let cachedReadProvider: ReadProvider | null = null;

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

export interface FundData {
  id: number;
  recipient: string;
  creator: string;
  startTime: number;
  endTime: number;
  active: boolean;
  donationCount: number;
  goalAmount: bigint;
  title: string;
  description: string;
  category: string;
}

function getWriteProvider(): ethers.BrowserProvider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet detected. Please install MetaMask.");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

function getReadProvider(): ReadProvider {
  if (cachedReadProvider) {
    return cachedReadProvider;
  }

  if (RPC_URL) {
    cachedReadProvider = new ethers.JsonRpcProvider(RPC_URL);
    return cachedReadProvider;
  }

  if (typeof window !== "undefined" && window.ethereum) {
    cachedReadProvider = new ethers.BrowserProvider(window.ethereum);
    return cachedReadProvider;
  }

  throw new Error(
    "Read provider not configured. Set NEXT_PUBLIC_RPC_URL or connect a wallet.",
  );
}

async function getSignedContract(): Promise<ethers.Contract> {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS.",
    );
  }
  const provider = getWriteProvider();
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, COVALENT_FUND_ABI, signer);
}

function getReadContract(): ethers.Contract {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS.",
    );
  }
  return new ethers.Contract(CONTRACT_ADDRESS, COVALENT_FUND_ABI, getReadProvider());
}

function normalizeFund(raw: {
  id: bigint;
  recipient: string;
  creator: string;
  startTime: bigint;
  endTime: bigint;
  active: boolean;
  donationCount: bigint;
  goalAmount: bigint;
  title: string;
  description: string;
  category: string;
}): FundData {
  return {
    id: Number(raw.id),
    recipient: raw.recipient,
    creator: raw.creator,
    startTime: Number(raw.startTime),
    endTime: Number(raw.endTime),
    active: raw.active,
    donationCount: Number(raw.donationCount),
    goalAmount: BigInt(raw.goalAmount),
    title: raw.title,
    description: raw.description,
    category: raw.category,
  };
}

export function getContractAddress(): string {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS.",
    );
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

export async function getUsdtBalance(address: string): Promise<bigint> {
  const provider = getReadProvider();
  const usdtAddress = getUsdtAddress();
  const code = await provider.getCode(usdtAddress);

  if (!code || code === "0x") {
    throw new Error(
      `No contract found at USDT address ${usdtAddress}. Check NEXT_PUBLIC_USDT_ADDRESS and the selected network.`,
    );
  }

  const usdt = new ethers.Contract(usdtAddress, ERC20_ABI, provider);

  try {
    return await usdt.balanceOf(address);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("BAD_DATA") || message.includes("could not decode")) {
      throw new Error(
        `Failed to read USDT balance at ${usdtAddress}. The token may not exist on this network.`,
      );
    }
    throw error;
  }
}

export async function getUsdtAllowance(
  owner: string,
  spender: string,
): Promise<bigint> {
  const provider = getReadProvider();
  const usdtAddress = getUsdtAddress();
  const code = await provider.getCode(usdtAddress);

  if (!code || code === "0x") {
    throw new Error(
      `No contract found at USDT address ${usdtAddress}. Check NEXT_PUBLIC_USDT_ADDRESS and the selected network.`,
    );
  }

  const usdt = new ethers.Contract(usdtAddress, ERC20_ABI, provider);

  try {
    return await usdt.allowance(owner, spender);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("BAD_DATA") || message.includes("could not decode")) {
      throw new Error(
        `Failed to read USDT allowance at ${usdtAddress}. The token may not exist on this network.`,
      );
    }
    throw error;
  }
}

export async function approveUsdt(spender: string, amount: bigint): Promise<void> {
  const provider = getWriteProvider();
  const signer = await provider.getSigner();
  const usdtAddress = getUsdtAddress();
  const code = await provider.getCode(usdtAddress);

  if (!code || code === "0x") {
    throw new Error(
      `No contract found at USDT address ${usdtAddress}. Check NEXT_PUBLIC_USDT_ADDRESS and the selected network.`,
    );
  }

  const usdt = new ethers.Contract(usdtAddress, ERC20_ABI, signer);
  const tx = await usdt.approve(spender, amount);
  await tx.wait();
}

export async function getCUsdtBalanceHandle(
  address: string,
): Promise<string | null> {
  const provider = getReadProvider();
  const cUsdtAddress = getCUsdtAddress();
  const cUsdt = new ethers.Contract(cUsdtAddress, CUSDT_ABI, provider);

  try {
    const handle = await cUsdt.confidentialBalanceOf(address);
    if (
      !handle ||
      handle === ethers.ZeroHash ||
      handle === "0x0000000000000000000000000000000000000000000000000000000000000000" ||
      handle === "0x"
    ) {
      return null;
    }

    if (typeof handle !== "string" || !handle.startsWith("0x") || handle.length !== 66) {
      console.warn(`Unexpected cUSDT handle format: ${handle}`);
      return null;
    }

    return handle;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("not initialized") ||
      message.includes("ZeroBalance") ||
      message.includes("BAD_DATA") ||
      message.includes("could not decode")
    ) {
      return null;
    }
    throw error;
  }
}

export async function shieldUsdtToCUsdt(to: string, amount: bigint): Promise<void> {
  const provider = getWriteProvider();
  const signer = await provider.getSigner();
  const cUsdt = new ethers.Contract(getCUsdtAddress(), CUSDT_ABI, signer);
  const tx = await cUsdt.wrap(to, amount);
  await tx.wait();
}

export async function unshieldCUsdt(
  from: string,
  to: string,
  handle: Uint8Array,
  inputProof: Uint8Array,
): Promise<ethers.TransactionReceipt | null> {
  const provider = getWriteProvider();
  const signer = await provider.getSigner();
  const cUsdt = new ethers.Contract(getCUsdtAddress(), CUSDT_ABI, signer);
  const tx = await cUsdt.unwrap(from, to, handle, inputProof, {
    gasLimit: 5_000_000,
  });
  return tx.wait();
}

export function parseBurntAmountHandleFromUnshieldReceipt(
  _cUsdtAddress: string,
  receipt: ethers.TransactionReceipt | null,
): string | null {
  if (!receipt || !receipt.logs?.length) return null;

  const cUsdtInterface = new ethers.Interface(CUSDT_ABI);
  const unwrapTopic = cUsdtInterface.getEvent("UnwrapRequested")?.topicHash;
  if (!unwrapTopic) return null;

  const log = receipt.logs.find((entry) => entry.topics[0] === unwrapTopic);
  if (!log) return null;

  const parsed = cUsdtInterface.parseLog({
    topics: log.topics as string[],
    data: log.data,
  });

  if (!parsed || parsed.name !== "UnwrapRequested") return null;
  const amount = parsed.args?.amount ?? parsed.args?.[1];
  if (typeof amount !== "string" || !amount.startsWith("0x")) return null;
  return amount;
}

export async function finalizeUnshieldCUsdt(
  burntAmountHandle: string,
  burntAmountCleartext: bigint,
  decryptionProof: string | Uint8Array,
): Promise<void> {
  const provider = getWriteProvider();
  const signer = await provider.getSigner();
  const cUsdt = new ethers.Contract(getCUsdtAddress(), CUSDT_ABI, signer);
  const proofBytes =
    typeof decryptionProof === "string"
      ? decryptionProof
      : ethers.hexlify(
          decryptionProof instanceof Uint8Array
            ? decryptionProof
            : new Uint8Array(decryptionProof),
        );
  const tx = await cUsdt.finalizeUnwrap(
    burntAmountHandle,
    burntAmountCleartext,
    proofBytes,
    { gasLimit: 5_000_000 },
  );
  await tx.wait();
}

export async function donateConfidential(
  fundId: number,
  handle: Uint8Array,
  inputProof: Uint8Array,
): Promise<void> {
  const provider = getWriteProvider();
  const signer = await provider.getSigner();
  const cUsdt = new ethers.Contract(getCUsdtAddress(), CUSDT_ABI, signer);
  const encodedFundId = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [fundId]);

  const tx = await cUsdt.confidentialTransferAndCall(
    getContractAddress(),
    handle,
    inputProof,
    encodedFundId,
    { gasLimit: 5_000_000 },
  );
  await tx.wait();
}

export async function createFund(params: {
  title: string;
  description: string;
  category: string;
  goalAmount: bigint;
  recipient: string;
  startTime: number;
  endTime: number;
}): Promise<number> {
  const contract = await getSignedContract();
  const tx = await contract.createFund({
    recipient: params.recipient,
    startTime: params.startTime,
    endTime: params.endTime,
    goalAmount: params.goalAmount,
    title: params.title.trim(),
    description: params.description.trim(),
    category: params.category.trim(),
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
    throw new Error("FundCreated event not found in transaction receipt.");
  }

  return Number(event.args.fundId);
}

export async function requestReveal(fundId: number, token?: string): Promise<void> {
  const contract = await getSignedContract();
  const tokenAddr = token || getCUsdtAddress();
  const tx = await contract.requestReveal(fundId, tokenAddr);
  await tx.wait();
}

export async function revealTotalWithProof(
  fundId: number,
  decryptedTotal: bigint,
  decryptionProof: string | Uint8Array,
  token?: string,
): Promise<void> {
  const contract = await getSignedContract();
  const tokenAddr = token || getCUsdtAddress();
  const proofBytes =
    typeof decryptionProof === "string"
      ? decryptionProof
      : ethers.hexlify(
          decryptionProof instanceof Uint8Array
            ? decryptionProof
            : new Uint8Array(decryptionProof),
        );
  const tx = await contract.revealTotal(
    fundId,
    tokenAddr,
    decryptedTotal,
    proofBytes,
  );
  await tx.wait();
}

export async function withdrawFund(fundId: number, token?: string): Promise<void> {
  const contract = await getSignedContract();
  const tokenAddr = token || getCUsdtAddress();
  const tx = await contract.withdraw(fundId, tokenAddr);
  await tx.wait();
}

export async function getFund(fundId: number): Promise<FundData> {
  if (!fundId || fundId < 1) {
    throw new Error("Invalid fund ID. Please enter a valid fund number.");
  }

  const contract = getReadContract();
  try {
    const fund = await contract.getFund(fundId);
    return normalizeFund(fund);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("BAD_DATA") ||
      message.includes("could not decode") ||
      message.includes("value=\"0x\"") ||
      message.includes("FundDoesNotExist") ||
      message.includes("execution reverted")
    ) {
      throw new Error(
        "Fund not found. Check the fund ID and the currently selected network.",
      );
    }
    throw error;
  }
}

export async function getFundCount(): Promise<number> {
  const contract = getReadContract();
  return Number(await contract.getFundCount());
}

export async function listFunds(): Promise<FundData[]> {
  const count = await getFundCount();
  if (count === 0) return [];

  const funds = await Promise.all(
    Array.from({ length: count }, (_, index) => getFund(index + 1).catch(() => null)),
  );

  return funds
    .filter((fund): fund is FundData => fund !== null)
    .sort((a, b) => b.id - a.id);
}

export async function listViewerFunds(address: string): Promise<FundData[]> {
  const funds = await listFunds();
  const permissions = await Promise.all(
    funds.map((fund) => checkIsAdmin(fund.id, address).catch(() => false)),
  );
  return funds.filter((_, index) => permissions[index]);
}

export async function getEncryptedTotal(
  fundId: number,
  token?: string,
): Promise<string> {
  const contract = getReadContract();
  const tokenAddr = token || getCUsdtAddress();
  return contract.getEncryptedTotal(fundId, tokenAddr);
}

export async function getRevealedTotal(
  fundId: number,
  token?: string,
): Promise<bigint> {
  const contract = getReadContract();
  const tokenAddr = token || getCUsdtAddress();
  return contract.getRevealedTotal(fundId, tokenAddr);
}

export async function isTokenRevealed(
  fundId: number,
  token?: string,
): Promise<boolean> {
  const contract = getReadContract();
  const tokenAddr = token || getCUsdtAddress();
  return contract.isTokenRevealed(fundId, tokenAddr);
}

export async function isRevealRequested(
  fundId: number,
  token?: string,
): Promise<boolean> {
  const contract = getReadContract();
  const tokenAddr = token || getCUsdtAddress();
  return contract.isRevealRequested(fundId, tokenAddr);
}

export async function getFundTokens(fundId: number): Promise<string[]> {
  const contract = getReadContract();
  return contract.getFundTokens(fundId);
}

export async function checkIsAdmin(
  fundId: number,
  address: string,
): Promise<boolean> {
  const contract = getReadContract();
  return contract.isAdmin(fundId, address);
}

export async function getContractOwner(): Promise<string> {
  const contract = getReadContract();
  return contract.owner();
}

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
  const provider = getWriteProvider();
  const signer = await provider.getSigner();
  const faucet = new ethers.Contract(getFaucetAddress(), FAUCET_ABI, signer);
  const tx = await faucet.drip();
  await tx.wait();
}

export async function faucetTimeUntilNextDrip(address: string): Promise<number> {
  const provider = getReadProvider();
  const faucet = new ethers.Contract(getFaucetAddress(), FAUCET_ABI, provider);
  return Number(await faucet.timeUntilNextDrip(address));
}
