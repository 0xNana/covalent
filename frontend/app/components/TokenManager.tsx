"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  getUsdtBalance,
  getUsdtAllowance,
  approveUsdt,
  shieldUsdtToCUsdt,
  unshieldCUsdt,
  finalizeUnshieldCUsdt,
  parseBurntAmountHandleFromUnshieldReceipt,
  getCUsdtAddress,
  getCUsdtBalanceHandle,
} from "@/app/lib/contract";
import { encryptDonationAmount, initFHEVM, decryptUserBalance, publicDecryptUnshieldHandle } from "@/app/lib/fheClient";
import { ethers } from "ethers";

const USDT_DECIMALS = 6;

type Tab = "shield" | "unshield";

interface BalanceInfo {
  usdt: bigint;
  allowance: bigint;
  cUsdtHandle: string | null;
  cUsdtDecrypted: bigint | null;
}

export default function TokenManager() {
  const { address, isConnected } = useAccount();

  const [tab, setTab] = useState<Tab>("shield");
  const [amount, setAmount] = useState("");
  const [balances, setBalances] = useState<BalanceInfo>({
    usdt: BigInt(0),
    allowance: BigInt(0),
    cUsdtHandle: null,
    cUsdtDecrypted: null,
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [decryptingBalance, setDecryptingBalance] = useState(false);

  const addressesConfigured = Boolean(
    process.env.NEXT_PUBLIC_USDT_ADDRESS &&
      process.env.NEXT_PUBLIC_CUSDT_ADDRESS,
  );

  const fetchBalances = useCallback(async () => {
    if (!address || !addressesConfigured) return;
    try {
      const [usdt, allowance, cUsdtHandle] = await Promise.all([
        getUsdtBalance(address),
        getUsdtAllowance(address, getCUsdtAddress()),
        getCUsdtBalanceHandle(address).catch(() => null),
      ]);
      setBalances((prev) => ({
        ...prev,
        usdt,
        allowance,
        cUsdtHandle,
        // Don't reset decrypted balance - keep it until user explicitly decrypts again
      }));
    } catch {
      // silently fail — balances show 0
    }
  }, [address, addressesConfigured]);

  const handleDecryptBalance = useCallback(async () => {
    if (!address || !balances.cUsdtHandle || !addressesConfigured) return;
    
    setDecryptingBalance(true);
    setError(null);
    
    try {
      // Initialize FHEVM if needed
      await initFHEVM();
      
      // Get signer for decryption signature
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No wallet detected");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Decrypt the balance
      const decrypted = await decryptUserBalance(
        balances.cUsdtHandle!,
        getCUsdtAddress(),
        address,
        signer
      );
      
      setBalances((prev) => ({
        ...prev,
        cUsdtDecrypted: decrypted,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to decrypt balance";
      setError(msg);
    } finally {
      setDecryptingBalance(false);
    }
  }, [address, balances.cUsdtHandle, addressesConfigured]);

  useEffect(() => {
    if (isConnected) fetchBalances();
  }, [isConnected, fetchBalances]);

  const formatUsdt = (raw: bigint): string => {
    const num = Number(raw) / 10 ** USDT_DECIMALS;
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parsedAmount = (): bigint => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return BigInt(0);
    return BigInt(Math.round(num * 10 ** USDT_DECIMALS));
  };

  const handleShield = async () => {
    if (!address) return;
    const raw = parsedAmount();
    if (raw <= BigInt(0)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (balances.allowance < raw) {
        setStep("Approving...");
        await approveUsdt(getCUsdtAddress(), raw);
      }

      setStep("Shielding to private tokens...");
      await shieldUsdtToCUsdt(address, raw);

      setSuccess(`Shielded ${amount} USDT to private tokens`);
      setAmount("");
      await fetchBalances();
      // Reset decrypted balance so user can decrypt again to see updated balance
      setBalances((prev) => ({ ...prev, cUsdtDecrypted: null }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Conversion failed";
      setError(msg);
    } finally {
      setLoading(false);
      setStep(null);
    }
  };

  const handleUnshield = async () => {
    if (!address) return;
    const raw = parsedAmount();
    if (raw <= BigInt(0)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      setStep("Initializing encryption...");
      await initFHEVM();

      setStep("Preparing withdrawal...");
      const { handle, inputProof } = await encryptDonationAmount(
        getCUsdtAddress(),
        address,
        raw,
      );

      setStep("Unshielding cUSDT to USDT (step 1/2)...");
      const receipt = await unshieldCUsdt(address, address, handle, inputProof);
      const burntAmountHandle = parseBurntAmountHandleFromUnshieldReceipt(getCUsdtAddress(), receipt);
      if (!burntAmountHandle) {
        throw new Error("Could not read unshield request from transaction. Please try again.");
      }

      setStep("Decrypting amount (step 2/2)...");
      const { decryptedValue, decryptionProof } = await publicDecryptUnshieldHandle(burntAmountHandle);

      setStep("Finalizing withdrawal...");
      await finalizeUnshieldCUsdt(burntAmountHandle, Number(decryptedValue), decryptionProof);

      setSuccess(`Withdrew ${amount} USDT to your wallet.`);
      setAmount("");
      await fetchBalances();
      setBalances((prev) => ({ ...prev, cUsdtDecrypted: null }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Withdrawal failed";
      setError(msg);
    } finally {
      setLoading(false);
      setStep(null);
    }
  };

  if (!isConnected) return null;

  if (!addressesConfigured) {
    return (
      <div className="card p-6">
        <p className="text-sm text-brand-muted">
          Token contracts not configured. Set{" "}
          <code className="text-brand-green">NEXT_PUBLIC_USDT_ADDRESS</code> and{" "}
          <code className="text-brand-green">NEXT_PUBLIC_CUSDT_ADDRESS</code> in
          your <code>.env.local</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      {/* Balance row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gray-50 rounded-lg p-4 border border-brand-border">
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">
            USDT Balance
          </p>
          <p className="text-xl font-bold text-brand-dark font-mono">
            ${formatUsdt(balances.usdt)}
          </p>
        </div>
        <div className="bg-brand-green-light rounded-lg p-4 border border-green-200">
          <p className="text-xs font-semibold text-brand-green uppercase tracking-wide mb-1">
            Private Balance (cUSDT)
          </p>
          {balances.cUsdtDecrypted !== null ? (
            <p className="text-xl font-bold text-brand-green font-mono">
              ${formatUsdt(balances.cUsdtDecrypted)}
            </p>
          ) : balances.cUsdtHandle ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-brand-green font-mono">Encrypted</p>
              <button
                onClick={handleDecryptBalance}
                disabled={decryptingBalance}
                className="ml-auto text-xs px-2 py-1 bg-brand-green text-white rounded hover:bg-brand-green-hover disabled:opacity-50 transition-colors"
              >
                {decryptingBalance ? "Decrypting..." : "Decrypt"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-brand-green font-mono">No balance</p>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => {
            setTab("shield");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
            tab === "shield"
              ? "bg-white text-brand-dark shadow-sm"
              : "text-brand-muted hover:text-brand-body"
          }`}
        >
          Shield
        </button>
        <button
          onClick={() => {
            setTab("unshield");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
            tab === "unshield"
              ? "bg-white text-brand-dark shadow-sm"
              : "text-brand-muted hover:text-brand-body"
          }`}
        >
          Unshield
        </button>
      </div>

      {/* Amount input */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-brand-dark block mb-2">
          Amount ({tab === "shield" ? "USDT" : "Private Tokens"})
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="input-field font-mono pr-16"
            disabled={loading}
          />
          {tab === "shield" && balances.usdt > 0n && (
            <button
              onClick={() =>
                setAmount(
                  (Number(balances.usdt) / 10 ** USDT_DECIMALS).toString(),
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-green hover:text-brand-green-hover transition-colors"
            >
              MAX
            </button>
          )}
        </div>
      </div>

      {/* Step indicator */}
      {step && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-brand-green-light border border-green-200 rounded-lg">
          <div className="w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-brand-green font-medium">{step}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
          <span className="material-icons text-red-500 text-sm">error</span>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-brand-green-light border border-green-200 rounded-lg">
          <span className="material-icons text-brand-green text-sm">
            check_circle
          </span>
          <p className="text-sm text-brand-green">{success}</p>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={tab === "shield" ? handleShield : handleUnshield}
        disabled={loading || !amount || parsedAmount() <= 0n}
        className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : tab === "shield" ? (
          <>
            <span className="material-icons">lock</span>
            Shield
          </>
        ) : (
          <>
            <span className="material-icons">lock_open</span>
            Unshield
          </>
        )}
      </button>

      {/* Info text */}
      <p className="text-xs text-brand-muted mt-4 leading-relaxed">
        {tab === "shield"
          ? "Shields your USDT into private tokens. Your balance becomes invisible and can be used for anonymous donations."
          : "Unshields private tokens back to standard USDT in your wallet."}
      </p>
    </div>
  );
}
