"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  getUsdtBalance,
  getUsdtAllowance,
  approveUsdt,
  wrapUsdtToCUsdt,
  unwrapCUsdt,
  getCUsdtAddress,
} from "@/app/lib/contract";
import { encryptDonationAmount } from "@/app/lib/fheClient";

const USDT_DECIMALS = 6;

type Tab = "wrap" | "unwrap";

interface BalanceInfo {
  usdt: bigint;
  allowance: bigint;
}

export default function TokenManager() {
  const { address, isConnected } = useAccount();

  const [tab, setTab] = useState<Tab>("wrap");
  const [amount, setAmount] = useState("");
  const [balances, setBalances] = useState<BalanceInfo>({
    usdt: BigInt(0),
    allowance: BigInt(0),
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addressesConfigured = Boolean(
    process.env.NEXT_PUBLIC_USDT_ADDRESS &&
      process.env.NEXT_PUBLIC_CUSDT_ADDRESS,
  );

  const fetchBalances = useCallback(async () => {
    if (!address || !addressesConfigured) return;
    try {
      const [usdt, allowance] = await Promise.all([
        getUsdtBalance(address),
        getUsdtAllowance(address, getCUsdtAddress()),
      ]);
      setBalances({ usdt, allowance });
    } catch {
      // silently fail — balances show 0
    }
  }, [address, addressesConfigured]);

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

  const handleWrap = async () => {
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

      setStep("Converting to private tokens...");
      await wrapUsdtToCUsdt(address, raw);

      setSuccess(`Converted ${amount} USDT to private tokens`);
      setAmount("");
      await fetchBalances();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Conversion failed";
      setError(msg);
    } finally {
      setLoading(false);
      setStep(null);
    }
  };

  const handleUnwrap = async () => {
    if (!address) return;
    const raw = parsedAmount();
    if (raw <= BigInt(0)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      setStep("Preparing withdrawal...");
      const { handle, inputProof } = await encryptDonationAmount(
        getCUsdtAddress(),
        address,
        raw,
      );

      setStep("Converting back to USDT...");
      await unwrapCUsdt(address, address, handle, inputProof);

      setSuccess(`Withdrawal initiated for ${amount} USDT.`);
      setAmount("");
      await fetchBalances();
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
            Private Balance
          </p>
          <p className="text-xl font-bold text-brand-green font-mono">
            Hidden
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => {
            setTab("wrap");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
            tab === "wrap"
              ? "bg-white text-brand-dark shadow-sm"
              : "text-brand-muted hover:text-brand-body"
          }`}
        >
          Make Private
        </button>
        <button
          onClick={() => {
            setTab("unwrap");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
            tab === "unwrap"
              ? "bg-white text-brand-dark shadow-sm"
              : "text-brand-muted hover:text-brand-body"
          }`}
        >
          Withdraw
        </button>
      </div>

      {/* Amount input */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-brand-dark block mb-2">
          Amount ({tab === "wrap" ? "USDT" : "Private Tokens"})
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
          {tab === "wrap" && balances.usdt > 0n && (
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
        onClick={tab === "wrap" ? handleWrap : handleUnwrap}
        disabled={loading || !amount || parsedAmount() <= 0n}
        className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : tab === "wrap" ? (
          <>
            <span className="material-icons">lock</span>
            Make Private
          </>
        ) : (
          <>
            <span className="material-icons">lock_open</span>
            Withdraw to USDT
          </>
        )}
      </button>

      {/* Info text */}
      <p className="text-xs text-brand-muted mt-4 leading-relaxed">
        {tab === "wrap"
          ? "Converts your USDT into private tokens. Your balance becomes invisible and can be used for anonymous donations."
          : "Converts private tokens back to standard USDT in your wallet."}
      </p>
    </div>
  );
}
