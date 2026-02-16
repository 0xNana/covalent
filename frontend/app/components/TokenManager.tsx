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
  getUsdtAddress,
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
    process.env.NEXT_PUBLIC_USDT_ADDRESS && process.env.NEXT_PUBLIC_CUSDT_ADDRESS,
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
      // Step 1: Approve if needed
      if (balances.allowance < raw) {
        setStep("Approving token spend...");
        await approveUsdt(getCUsdtAddress(), raw);
      }

      // Step 2: Wrap
      setStep("Converting to private tokens...");
      await wrapUsdtToCUsdt(address, raw);

      setSuccess(`Converted ${amount} USDT to private tokens`);
      setAmount("");
      await fetchBalances();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Wrap failed";
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
      // Step 1: Encrypt the amount for the unwrap call
      setStep("Preparing withdrawal...");
      const { handle, inputProof } = await encryptDonationAmount(getCUsdtAddress(), address, raw);

      // Step 2: Call unwrap
      setStep("Converting back to USDT...");
      await unwrapCUsdt(address, address, handle, inputProof);

      setSuccess(
        `Withdrawal initiated for ${amount} cUSDT. Your USDT will arrive shortly.`
      );
      setAmount("");
      await fetchBalances();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unwrap failed";
      setError(msg);
    } finally {
      setLoading(false);
      setStep(null);
    }
  };

  if (!isConnected) return null;

  if (!addressesConfigured) {
    return (
      <section className="bg-lighter-slate p-8 rounded-2xl border border-white/5 card-shadow">
        <h2 className="text-2xl font-bold text-white mb-2">Token Manager</h2>
        <p className="text-slate-400 text-sm">
          Token contracts not configured. Set <code className="text-primary-blue">NEXT_PUBLIC_USDT_ADDRESS</code> and{" "}
          <code className="text-primary-blue">NEXT_PUBLIC_CUSDT_ADDRESS</code> in your <code>.env.local</code> to enable wrapping.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-lighter-slate p-8 rounded-2xl border border-white/5 card-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Token Manager
          </h2>
          <p className="text-slate-400 text-sm">
            Convert between standard and private tokens
          </p>
        </div>
        <span className="material-icons text-primary-purple text-3xl">
          swap_horiz
        </span>
      </div>

      {/* Balance row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-deep-slate rounded-xl p-4 border border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            USDT Balance
          </p>
          <p className="text-xl font-black text-white font-mono">
            {formatUsdt(balances.usdt)}
          </p>
        </div>
        <div className="bg-deep-slate rounded-xl p-4 border border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Private Balance
          </p>
          <p className="text-xl font-black text-primary-purple font-mono">
            Hidden
          </p>
          <p className="text-[10px] text-slate-600 mt-1">
            Balance is private
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setTab("wrap");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            tab === "wrap"
              ? "bg-primary-blue/10 text-primary-blue border-2 border-primary-blue"
              : "bg-deep-slate text-slate-400 border border-white/10 hover:border-white/20"
          }`}
        >
          <span className="material-icons text-sm align-middle mr-1">
            arrow_forward
          </span>
          Make Private
        </button>
        <button
          onClick={() => {
            setTab("unwrap");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            tab === "unwrap"
              ? "bg-primary-purple/10 text-primary-purple border-2 border-primary-purple"
              : "bg-deep-slate text-slate-400 border border-white/10 hover:border-white/20"
          }`}
        >
          <span className="material-icons text-sm align-middle mr-1">
            arrow_back
          </span>
          Withdraw
        </button>
      </div>

      {/* Amount input */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-slate-300 block mb-2">
          Amount ({tab === "wrap" ? "USDT" : "cUSDT"})
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Enter ${tab === "wrap" ? "USDT" : "cUSDT"} amount`}
            className="w-full bg-deep-slate border-2 border-white/10 rounded-xl px-6 py-4 text-xl font-mono text-white focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue outline-none transition-all placeholder:text-slate-700"
            disabled={loading}
          />
          {tab === "wrap" && balances.usdt > 0n && (
            <button
              onClick={() =>
                setAmount(
                  (
                    Number(balances.usdt) /
                    10 ** USDT_DECIMALS
                  ).toString()
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary-blue hover:text-primary-blue/80 transition-colors"
            >
              MAX
            </button>
          )}
        </div>
      </div>

      {/* Step indicator */}
      {step && (
        <div className="flex items-center gap-3 mb-4 p-4 bg-primary-blue/5 border border-primary-blue/20 rounded-xl">
          <div className="w-4 h-4 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-primary-blue font-medium">{step}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <span className="material-icons text-red-400 text-sm">error</span>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-center gap-2 p-4 mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <span className="material-icons text-emerald-400 text-sm">
            check_circle
          </span>
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={tab === "wrap" ? handleWrap : handleUnwrap}
        disabled={loading || !amount || parsedAmount() <= 0n}
        className={`w-full font-extrabold py-5 px-8 rounded-2xl text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          tab === "wrap"
            ? "gradient-btn glow-blue text-white"
            : "bg-primary-purple hover:bg-primary-purple/90 text-white"
        }`}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : tab === "wrap" ? (
          <>
            <span className="material-icons">arrow_forward</span>
            Make Private
          </>
        ) : (
          <>
            <span className="material-icons">arrow_back</span>
            Withdraw to USDT
          </>
        )}
      </button>

      {/* Info */}
      <div className="mt-6 space-y-3">
        <div className="flex items-start gap-3 p-4 bg-primary-blue/5 border border-primary-blue/20 rounded-xl">
          <span className="material-icons text-primary-blue mt-0.5 text-sm">
            info
          </span>
          <div className="text-xs text-slate-300 leading-relaxed">
            {tab === "wrap" ? (
              <>
                <strong>Make Private</strong> converts your USDT into private
                tokens. Your balance becomes invisible on-chain and can be
                used for anonymous donations.
              </>
            ) : (
              <>
                <strong>Withdraw</strong> converts your private tokens back
                to standard USDT in your wallet. This may take a moment
                to process.
              </>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
