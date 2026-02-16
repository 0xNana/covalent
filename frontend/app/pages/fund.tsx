"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

const SECONDS_PER_DAY = 86_400;
const MS_PER_SECOND = 1_000;
import {
  getFund,
  getEncryptedTotal,
  getRevealedTotal,
  isTokenRevealed,
  type FundData,
} from "@/app/lib/contract";
import FundStats from "@/app/components/FundStats";
import DonateCard from "@/app/components/DonateCard";

interface TokenStats {
  encryptedTotalHex: string | null;
  revealedTotal: number;
  revealed: boolean;
}

type FundWithTokenStats = FundData & { tokenStats: TokenStats };

export default function FundPage() {
  const params = useParams();
  const fundId = typeof params?.id === "string" ? params.id : undefined;

  const [fund, setFund] = useState<FundWithTokenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadFundData = useCallback(async () => {
    if (!fundId) return;
    try {
      setLoading(true);
      const parsedId = parseInt(fundId, 10);
      if (isNaN(parsedId) || parsedId < 1) {
        setError("Invalid fund ID");
        return;
      }

      const fundData = await getFund(parsedId);

      // Fetch per-token stats (default token = cUSDT)
      let tokenStats: TokenStats = {
        encryptedTotalHex: null,
        revealedTotal: 0,
        revealed: false,
      };

      try {
        const [total, revealed, revealedTotal] = await Promise.all([
          getEncryptedTotal(parsedId),
          isTokenRevealed(parsedId),
          getRevealedTotal(parsedId),
        ]);
        tokenStats = {
          encryptedTotalHex: total,
          revealedTotal,
          revealed,
        };
      } catch {
        // Token stats may fail if no donations yet — not critical
      }

      if (mountedRef.current) {
        setFund({ ...fundData, tokenStats });
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : "Failed to load fund";
        setError(message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fundId]);

  useEffect(() => {
    mountedRef.current = true;
    loadFundData();
    return () => {
      mountedRef.current = false;
    };
  }, [loadFundData]);

  if (!fundId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl max-w-md">
          Missing fund ID
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-400">Loading fund information...</p>
        </div>
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl max-w-md">
          {error || "Fund not found"}
        </div>
      </div>
    );
  }

  const nowSec = Math.floor(Date.now() / MS_PER_SECOND);
  const isActive = fund.active && nowSec >= fund.startTime && nowSec <= fund.endTime;
  const hasStarted = nowSec >= fund.startTime;
  const daysLeft = Math.max(0, Math.ceil((fund.endTime - nowSec) / SECONDS_PER_DAY));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-2">
              {fund.title ?? `Fund #${fund.id}`}
            </h1>
            {fund.description && (
              <p className="text-slate-400">{fund.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${
              isActive
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : !hasStarted
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-slate-500/10 border-slate-500/20 text-slate-400"
            }`}>
              <span className="material-icons text-sm">
                {isActive ? "radio_button_checked" : !hasStarted ? "schedule" : "check_circle"}
              </span>
              {isActive ? "Active" : !hasStarted ? "Upcoming" : "Ended"}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
              <span className="material-icons text-primary-purple text-sm">lock</span>
              <span className="text-sm font-semibold text-slate-300">Private Fund</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Fund overview */}
        <div className="space-y-8">
          <FundStats
            encryptedTotal={fund.tokenStats.encryptedTotalHex}
            donationCount={fund.donationCount}
            revealedTotal={fund.tokenStats.revealedTotal}
            revealed={fund.tokenStats.revealed}
          />

          {/* Fund details card */}
          <div className="bg-lighter-slate rounded-2xl p-8 border border-white/5 card-shadow">
            <h3 className="text-lg font-bold text-white mb-6">Fund Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Recipient</span>
                <span className="font-mono text-sm text-slate-300 truncate ml-4 max-w-[200px]">
                  {fund.recipient}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Creator</span>
                <span className="font-mono text-sm text-slate-300 truncate ml-4 max-w-[200px]">
                  {fund.creator}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Start Date</span>
                <span className="text-sm text-slate-300">
                  {new Date(fund.startTime * 1000).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">End Date</span>
                <span className="text-sm text-slate-300">
                  {new Date(fund.endTime * 1000).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </span>
              </div>
              {isActive && (
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Time Left</span>
                  <span className="text-sm font-bold text-white">{daysLeft} Days</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Donate form */}
        {isActive ? (
          <DonateCard fundId={fundId} onDonationComplete={loadFundData} />
        ) : !hasStarted ? (
          <div className="bg-lighter-slate rounded-2xl p-8 border border-amber-500/20 card-shadow text-center">
            <span className="material-icons text-amber-400 text-4xl mb-4">schedule</span>
            <h3 className="text-xl font-bold text-white mb-2">Fund Not Started</h3>
            <p className="text-slate-400">
              Donations open on{" "}
              {new Date(fund.startTime * 1000).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
        ) : (
          <div className="bg-lighter-slate rounded-2xl p-8 border border-white/5 card-shadow text-center">
            <span className="material-icons text-slate-500 text-4xl mb-4">check_circle</span>
            <h3 className="text-xl font-bold text-white mb-2">Fund Closed</h3>
            <p className="text-slate-400">This fund is no longer accepting donations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
