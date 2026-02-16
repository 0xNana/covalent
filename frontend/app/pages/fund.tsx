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
        // Token stats may fail if no donations yet
      }

      if (mountedRef.current) {
        setFund({ ...fundData, tokenStats });
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        const message =
          err instanceof Error ? err.message : "Failed to load fund";
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
        <div className="card p-6 border-red-200 text-red-600">
          Missing fund ID
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-brand-muted text-sm">Loading fund...</p>
        </div>
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-6 border-red-200 text-red-600">
          {error || "Fund not found"}
        </div>
      </div>
    );
  }

  const nowSec = Math.floor(Date.now() / MS_PER_SECOND);
  const isActive =
    fund.active && nowSec >= fund.startTime && nowSec <= fund.endTime;
  const hasStarted = nowSec >= fund.startTime;
  const daysLeft = Math.max(
    0,
    Math.ceil((fund.endTime - nowSec) / SECONDS_PER_DAY),
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Back link */}
      <div className="mb-6">
        <a
          href="/"
          className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-dark transition-colors"
        >
          <span className="material-icons text-lg">arrow_back</span>
          Back to explore
        </a>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left: Fund story (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Fund header */}
          <div>
            <h1 className="text-3xl font-extrabold text-brand-dark mb-2">
              {fund.title ?? `Fund #${fund.id}`}
            </h1>
            {fund.description && (
              <p className="text-brand-muted leading-relaxed">
                {fund.description}
              </p>
            )}
          </div>

          {/* Status badge row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                isActive
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : !hasStarted
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}
            >
              <span className="material-icons text-xs">
                {isActive
                  ? "radio_button_checked"
                  : !hasStarted
                    ? "schedule"
                    : "check_circle"}
              </span>
              {isActive ? "Active" : !hasStarted ? "Upcoming" : "Ended"}
            </span>
            {isActive && (
              <span className="text-xs text-brand-muted">
                {daysLeft} days left
              </span>
            )}
          </div>

          {/* Stats */}
          <FundStats
            encryptedTotal={fund.tokenStats.encryptedTotalHex}
            donationCount={fund.donationCount}
            revealedTotal={fund.tokenStats.revealedTotal}
            revealed={fund.tokenStats.revealed}
          />

          {/* Fund details */}
          <div className="card p-6">
            <h3 className="font-bold text-brand-dark mb-4 text-sm">
              Fund Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-muted">Recipient</span>
                <span className="font-mono text-brand-body">
                  {fund.recipient.slice(0, 6)}...{fund.recipient.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Created by</span>
                <span className="font-mono text-brand-body">
                  {fund.creator.slice(0, 6)}...{fund.creator.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Start</span>
                <span className="text-brand-body">
                  {new Date(fund.startTime * 1000).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">End</span>
                <span className="text-brand-body">
                  {new Date(fund.endTime * 1000).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Donate card (2 cols) */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            {isActive ? (
              <DonateCard fundId={fundId} onDonationComplete={loadFundData} />
            ) : !hasStarted ? (
              <div className="card p-8 text-center">
                <span className="material-icons text-amber-500 text-4xl mb-3">
                  schedule
                </span>
                <h3 className="text-lg font-bold text-brand-dark mb-1">
                  Not Started Yet
                </h3>
                <p className="text-sm text-brand-muted">
                  Donations open{" "}
                  {new Date(fund.startTime * 1000).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            ) : (
              <div className="card p-8 text-center">
                <span className="material-icons text-brand-muted text-4xl mb-3">
                  check_circle
                </span>
                <h3 className="text-lg font-bold text-brand-dark mb-1">
                  Fund Closed
                </h3>
                <p className="text-sm text-brand-muted">
                  This fund is no longer accepting donations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
