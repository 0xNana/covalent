"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";

const USDT_DECIMALS_DIVISOR = 1_000_000;
import {
  getFund,
  getEncryptedTotal,
  getRevealedTotal,
  isTokenRevealed,
  checkIsAdmin,
  withdrawFund,
  type FundData,
} from "@/app/lib/contract";
import RevealButton from "@/app/components/RevealButton";
import FundStats from "@/app/components/FundStats";

interface TokenStats {
  encryptedTotalHex: string;
  revealedTotal: number;
  revealed: boolean;
}

type AdminFund = FundData & TokenStats;

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [fundIdInput, setFundIdInput] = useState("");
  const [fund, setFund] = useState<AdminFund | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const loadFund = useCallback(async () => {
    if (!fundIdInput || !address) return;

    setLoading(true);
    setError(null);
    setFund(null);

    try {
      const fundId = parseInt(fundIdInput, 10);
      const [fundData, encryptedTotalHex, revealed, revealedTotal, adminStatus] =
        await Promise.all([
          getFund(fundId),
          getEncryptedTotal(fundId).catch(() => "0x" + "0".repeat(64)),
          isTokenRevealed(fundId).catch(() => false),
          getRevealedTotal(fundId).catch(() => 0),
          checkIsAdmin(fundId, address),
        ]);

      setFund({ ...fundData, encryptedTotalHex, revealed, revealedTotal });
      setIsAdmin(adminStatus);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load fund";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fundIdInput, address]);

  useEffect(() => {
    if (fundIdInput && address) {
      loadFund();
    }
  }, [address, fundIdInput, loadFund]);

  const handleWithdraw = async () => {
    if (!fund) return;
    setWithdrawLoading(true);
    setError(null);

    try {
      await withdrawFund(fund.id);
      await loadFund();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to withdraw";
      setError(message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Format revealed total from raw (6 decimals) to human-readable
  const formattedRevealedTotal = fund?.revealed
    ? (fund.revealedTotal / USDT_DECIMALS_DIVISOR).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0";

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-8 py-6 rounded-2xl max-w-md text-center">
          <span className="material-icons text-3xl mb-3">
            account_balance_wallet
          </span>
          <p className="font-bold text-lg text-white mb-2">
            Connect Your Wallet
          </p>
          <p className="text-sm text-slate-400">
            Connect your wallet to access the admin panel and manage funds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-white">Covalent Admin</span>
          </div>
          <p className="text-slate-400 text-sm">
            Manage funds, reveal totals, and withdraw donations
          </p>
        </div>
      </div>

      {/* Fund selector */}
      <section className="bg-lighter-slate p-8 rounded-2xl border border-white/5 card-shadow">
        <label className="text-sm font-semibold text-slate-300 block mb-3">
          Fund ID
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            min="1"
            step="1"
            value={fundIdInput}
            onChange={(e) => setFundIdInput(e.target.value)}
            className="flex-1 bg-deep-slate border-2 border-white/10 rounded-xl px-6 py-4 text-xl font-mono text-white focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue outline-none transition-all placeholder:text-slate-700"
            placeholder="Enter fund ID to manage"
          />
          <button
            onClick={loadFund}
            disabled={loading || !fundIdInput}
            className="px-8 py-4 gradient-btn text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Loading..." : "Load Fund"}
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <span className="material-icons text-red-400 text-sm">error</span>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Fund loaded */}
      {fund && (
        <div className="space-y-8">
          {/* Fund header */}
          <section className="bg-lighter-slate p-8 rounded-2xl border border-white/5 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                {fund.title ?? `Fund #${fund.id}`}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isAdmin
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {isAdmin ? "Administrator" : "Not Admin"}
              </span>
            </div>
            {fund.description && (
              <p className="text-slate-400 text-sm">{fund.description}</p>
            )}
          </section>

          {/* Stats */}
          <FundStats
            encryptedTotal={fund.encryptedTotalHex}
            donationCount={fund.donationCount}
            revealedTotal={fund.revealedTotal}
            revealed={fund.revealed}
          />

          {/* Reveal Results (if revealed) */}
          {fund.revealed && (
            <section className="bg-lighter-slate p-8 rounded-2xl border border-white/5 card-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-purple/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">
                  Reveal Results
                </h2>
                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                  <span className="material-icons text-xs">verified</span>
                  Verified
                </div>
              </div>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="text-6xl font-black text-white tracking-tight">
                    ${formattedRevealedTotal}
                  </span>
                  <span className="material-icons text-emerald-400 text-4xl">
                    check_circle
                  </span>
                </div>
                <p className="text-slate-400 text-sm">
                  Total raised from {fund.donationCount}{" "}
                  private donations
                </p>
              </div>
            </section>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <section className="bg-lighter-slate p-8 rounded-2xl border border-white/5 card-shadow">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Reveal Controls
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Choose what to reveal about this fund
                  </p>
                </div>
                <span className="material-icons text-primary-blue text-3xl">
                  analytics
                </span>
              </div>

              <div className="space-y-6">
                {/* Reveal type selector */}
                <div className="flex flex-col gap-4">
                  <label className="text-sm font-semibold text-slate-300">
                    What to Reveal
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-between p-4 rounded-xl border-2 border-primary-blue bg-primary-blue/5 text-soft-white">
                      <div className="flex items-center gap-3">
                        <span className="material-icons text-primary-blue">
                          add
                        </span>
                        <span className="font-bold">Total Sum</span>
                      </div>
                      <span className="material-icons text-primary-blue text-xl">
                        check_circle
                      </span>
                    </button>
                    <button className="flex items-center justify-between p-4 rounded-xl border border-white/10 text-slate-400 opacity-50 cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <span className="material-icons">avg_pace</span>
                        <span className="font-bold">Average</span>
                      </div>
                      <div className="w-5 h-5 rounded-full border border-white/20" />
                    </button>
                  </div>
                </div>

                {/* Reveal / Withdraw buttons */}
                {!fund.revealed && (
                  <RevealButton
                    fundId={fund.id}
                    onReveal={() => loadFund()}
                  />
                )}

                {fund.revealed && fund.revealedTotal > 0 && fund.active && (
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawLoading}
                    className="w-full gradient-btn glow-blue text-white font-extrabold py-5 px-8 rounded-2xl text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {withdrawLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="material-icons">
                          account_balance
                        </span>
                        Withdraw Funds to Recipient
                      </>
                    )}
                  </button>
                )}

                {fund.revealed && !fund.active && (
                  <div className="flex items-center gap-2 p-4 bg-slate-500/10 border border-slate-500/20 rounded-xl text-center justify-center">
                    <span className="material-icons text-slate-400 text-sm">
                      check_circle
                    </span>
                    <p className="text-sm text-slate-400">
                      Fund has been withdrawn and closed.
                    </p>
                  </div>
                )}

                {/* Info box */}
                <div className="flex items-start gap-3 p-4 bg-primary-blue/5 border border-primary-blue/20 rounded-xl">
                  <span className="material-icons text-primary-blue mt-0.5">
                    info
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Revealing shows only the combined donation total — individual
                    amounts stay private forever. Withdrawal sends the funds
                    to the recipient.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Fund details */}
          <section className="bg-lighter-slate p-6 rounded-2xl border border-white/5 card-shadow">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Recipient</p>
                <p className="font-mono text-slate-300 truncate">
                  {fund.recipient.slice(0, 6)}...{fund.recipient.slice(-4)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Status</p>
                <p className={fund.active ? "text-emerald-400 font-bold" : "text-slate-400"}>
                  {fund.active ? "Active" : "Closed"}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}


    </div>
  );
}
