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
      const [
        fundData,
        encryptedTotalHex,
        revealed,
        revealedTotal,
        adminStatus,
      ] = await Promise.all([
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

  const formattedRevealedTotal = fund?.revealed
    ? (fund.revealedTotal / USDT_DECIMALS_DIVISOR).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0";

  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="card p-8 max-w-sm text-center">
          <span className="material-icons text-brand-muted text-4xl mb-3">
            account_balance_wallet
          </span>
          <p className="font-bold text-brand-dark mb-1">Connect Your Wallet</p>
          <p className="text-sm text-brand-muted">
            Connect your wallet to manage funds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-brand-dark">
          Fund Admin
        </h1>
        <p className="text-brand-muted text-sm">
          Manage your funds, reveal totals, and withdraw.
        </p>
      </div>

      {/* Fund selector */}
      <div className="card p-6">
        <label className="text-sm font-semibold text-brand-dark block mb-2">
          Fund ID
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            step="1"
            value={fundIdInput}
            onChange={(e) => setFundIdInput(e.target.value)}
            className="input-field flex-1 font-mono"
            placeholder="Enter fund ID"
          />
          <button
            onClick={loadFund}
            disabled={loading || !fundIdInput}
            className="btn-primary px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Load"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <span className="material-icons text-red-500 text-sm">error</span>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Fund loaded */}
      {fund && (
        <div className="space-y-6">
          {/* Fund header */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-brand-dark">
                {fund.title ?? `Fund #${fund.id}`}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isAdmin
                    ? "bg-brand-green-light text-brand-green"
                    : "bg-red-50 text-red-500"
                }`}
              >
                {isAdmin ? "Admin" : "Not Admin"}
              </span>
            </div>
            {fund.description && (
              <p className="text-sm text-brand-muted">{fund.description}</p>
            )}
            <div className="flex gap-4 mt-4 text-sm">
              <div>
                <span className="text-brand-muted">Recipient: </span>
                <span className="font-mono text-brand-body">
                  {fund.recipient.slice(0, 6)}...{fund.recipient.slice(-4)}
                </span>
              </div>
              <div>
                <span className="text-brand-muted">Status: </span>
                <span
                  className={
                    fund.active
                      ? "text-brand-green font-bold"
                      : "text-brand-muted"
                  }
                >
                  {fund.active ? "Active" : "Closed"}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <FundStats
            encryptedTotal={fund.encryptedTotalHex}
            donationCount={fund.donationCount}
            revealedTotal={fund.revealedTotal}
            revealed={fund.revealed}
          />

          {/* Reveal Results */}
          {fund.revealed && (
            <div className="card p-6 text-center">
              <p className="text-sm text-brand-muted mb-1">Total Raised</p>
              <p className="text-4xl font-black text-brand-green mb-1">
                ${formattedRevealedTotal}
              </p>
              <p className="text-xs text-brand-muted">
                from {fund.donationCount} private donations
              </p>
            </div>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <div className="card p-6 space-y-4">
              <h3 className="font-bold text-brand-dark">Actions</h3>

              {/* Reveal */}
              {!fund.revealed && (
                <RevealButton fundId={fund.id} onReveal={() => loadFund()} />
              )}

              {/* Withdraw */}
              {fund.revealed && fund.revealedTotal > 0 && fund.active && (
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawLoading}
                  className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Withdraw to Recipient
                    </>
                  )}
                </button>
              )}

              {fund.revealed && !fund.active && (
                <div className="text-center py-3 text-sm text-brand-muted bg-gray-50 rounded-lg">
                  Fund has been withdrawn and closed.
                </div>
              )}

              {/* Info */}
              <p className="text-xs text-brand-muted leading-relaxed">
                Revealing shows only the combined total — individual amounts
                stay private. Withdrawal sends funds to the recipient.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
