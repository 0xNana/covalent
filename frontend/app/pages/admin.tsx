"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { getFund, getEncryptedTotal, checkIsAdmin, withdrawFund } from "@/app/lib/contract";
import RevealButton from "@/app/components/RevealButton";
import FundStats from "@/app/components/FundStats";

interface FundData {
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
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [fundIdInput, setFundIdInput] = useState("");
  const [fund, setFund] = useState<FundData | null>(null);
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
      const fundData = await getFund(fundId);
      const encryptedTotal = await getEncryptedTotal(fundId);
      const adminStatus = await checkIsAdmin(fundId, address);

      setFund({ ...fundData, encryptedTotal });
      setIsAdmin(adminStatus);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load fund";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fundIdInput, address]);

  useEffect(() => {
    if (fund) {
      loadFund();
    }
  }, [address]);

  const handleWithdraw = async () => {
    if (!fund) return;
    setWithdrawLoading(true);
    setError(null);

    try {
      await withdrawFund(fund.id);
      await loadFund();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to withdraw";
      setError(message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-lg max-w-md text-center">
          <svg className="h-8 w-8 mx-auto mb-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="font-medium">Connect your wallet to access the admin panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-gray-600">Manage funds, request reveals, and withdraw</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <label htmlFor="fundId" className="block text-sm font-medium text-gray-700 mb-2">
            Fund ID
          </label>
          <div className="flex gap-3">
            <input
              id="fundId"
              type="number"
              min="1"
              step="1"
              value={fundIdInput}
              onChange={(e) => setFundIdInput(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter fund ID to manage"
            />
            <button
              onClick={loadFund}
              disabled={loading || !fundIdInput}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Loading..." : "Load Fund"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {fund && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{fund.title}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isAdmin ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {isAdmin ? "Admin" : "Not Admin"}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4">{fund.description}</p>
            </div>

            <FundStats
              encryptedTotal={fund.encryptedTotal}
              donationCount={fund.donationCount}
              revealedTotal={fund.revealedTotal}
              revealed={fund.revealed}
            />

            {isAdmin && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
                <div className="flex flex-wrap gap-3">
                  {!fund.revealed && (
                    <RevealButton fundId={fund.id} onReveal={() => loadFund()} />
                  )}

                  {fund.revealed && fund.revealedTotal > 0 && fund.active && (
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawLoading}
                      className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {withdrawLoading ? "Processing..." : "Withdraw Funds"}
                    </button>
                  )}

                  {fund.revealed && !fund.active && (
                    <p className="text-sm text-gray-500 py-2">Fund has been withdrawn and closed.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
