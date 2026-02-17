"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import {
  faucetDrip,
  faucetTimeUntilNextDrip,
  isFaucetConfigured,
  getUsdtBalance,
} from "@/app/lib/contract";

const DRIP_AMOUNT = 1_000;
const USDT_DECIMALS = 6;

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function FaucetPage() {
  const { address, isConnected } = useAccount();

  const [cooldown, setCooldown] = useState<number>(0);
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const configured = isFaucetConfigured();

  const loadState = useCallback(async () => {
    if (!address || !configured) return;
    try {
      const [remaining, bal] = await Promise.all([
        faucetTimeUntilNextDrip(address),
        getUsdtBalance(address),
      ]);
      setCooldown(remaining);
      setBalance(bal);
    } catch {
      // non-critical
    }
  }, [address, configured]);

  useEffect(() => {
    if (isConnected) loadState();
  }, [isConnected, loadState]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const handleDrip = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await faucetDrip();
      setSuccess(true);
      await loadState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to claim";
      if (msg.includes("Come back in 24 hours")) {
        setError("You already claimed today. Come back in 24 hours.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const formattedBalance = (Number(balance) / 10 ** USDT_DECIMALS).toLocaleString(
    undefined,
    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  );

  const canClaim = cooldown === 0 && !loading;

  return (
    <div className="max-w-md mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-icons text-blue-500 text-3xl">
            water_drop
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-brand-dark mb-1">
          Test USDT Faucet
        </h1>
        <p className="text-brand-muted text-sm">
          Claim {DRIP_AMOUNT.toLocaleString()} test USDT every 24 hours to try
          out private donations.
        </p>
      </div>

      {/* Not configured */}
      {!configured && (
        <div className="card p-6 text-center">
          <p className="text-sm text-brand-muted">
            Faucet not deployed yet. Set{" "}
            <code className="text-brand-green">NEXT_PUBLIC_FAUCET_ADDRESS</code>{" "}
            in your <code>.env.local</code>.
          </p>
        </div>
      )}

      {/* Connect wallet prompt */}
      {configured && !isConnected && (
        <div className="card border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 flex items-center gap-3">
          <span className="material-icons text-lg">account_balance_wallet</span>
          Connect your wallet to claim test USDT.
        </div>
      )}

      {/* Main card */}
      {configured && isConnected && (
        <div className="card p-6 space-y-5">
          {/* Balance */}
          <div className="bg-gray-50 rounded-lg p-4 border border-brand-border text-center">
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">
              Your USDT Balance
            </p>
            <p className="text-3xl font-black text-brand-dark font-mono">
              ${formattedBalance}
            </p>
          </div>

          {/* Drip info */}
          <div className="text-center">
            <p className="text-sm text-brand-muted">
              Each claim gives you{" "}
              <span className="font-bold text-brand-dark">
                {DRIP_AMOUNT.toLocaleString()} USDT
              </span>
            </p>
          </div>

          {/* Cooldown */}
          {cooldown > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
                Next claim available in
              </p>
              <p className="text-2xl font-bold text-amber-700 font-mono">
                {formatCountdown(cooldown)}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 py-3 px-4 bg-red-50 rounded-lg border border-red-200">
              <span className="material-icons text-red-500 text-sm">
                error
              </span>
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-brand-green-light border border-green-200 rounded-lg p-4 text-center">
              <span className="material-icons text-brand-green text-2xl mb-1">
                check_circle
              </span>
              <p className="text-sm font-bold text-brand-green">
                {DRIP_AMOUNT.toLocaleString()} USDT claimed!
              </p>
              <p className="text-xs text-green-600 mt-1">
                You can now donate or make tokens private.
              </p>
            </div>
          )}

          {/* Claim button */}
          <button
            onClick={handleDrip}
            disabled={!canClaim}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-lg text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Claiming...
              </>
            ) : cooldown > 0 ? (
              <>
                <span className="material-icons">hourglass_top</span>
                Come Back Later
              </>
            ) : (
              <>
                <span className="material-icons">water_drop</span>
                Claim {DRIP_AMOUNT.toLocaleString()} USDT
              </>
            )}
          </button>
        </div>
      )}

      {/* Next steps */}
      {configured && isConnected && (
        <div className="card p-5">
          <h3 className="font-bold text-brand-dark text-sm mb-3">
            What to do next
          </h3>
          <div className="space-y-2">
            {[
              { href: "/private", label: "Make Private", desc: "Convert USDT to private tokens" },
              { href: "/donate", label: "Donate", desc: "Make a private donation to a fund" },
              { href: "/create", label: "Start a Fund", desc: "Create your own fundraiser" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-semibold text-brand-dark group-hover:text-brand-green transition-colors">
                    {item.label}
                  </p>
                  <p className="text-xs text-brand-muted">{item.desc}</p>
                </div>
                <span className="material-icons text-brand-muted text-lg group-hover:text-brand-green transition-colors">
                  arrow_forward
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
