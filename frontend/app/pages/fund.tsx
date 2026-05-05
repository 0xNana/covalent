"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import DonateCard from "@/app/components/DonateCard";
import FundStats from "@/app/components/FundStats";
import {
  getFund,
  getRevealedTotal,
  isRevealRequested,
  isTokenRevealed,
  type FundData,
} from "@/app/lib/contract";
import {
  formatFundDate,
  formatFundDateTime,
  formatWalletAddress,
  getDaysRemaining,
  getFundPhase,
  getFundShareUrl,
  getFundTheme,
} from "@/app/lib/fund-ui";

interface TokenStats {
  revealedTotal: bigint;
  revealed: boolean;
  revealRequested: boolean;
}

type FundWithTokenStats = FundData & { tokenStats: TokenStats };

export default function FundPage() {
  const params = useParams();
  const fundId = typeof params?.id === "string" ? params.id : undefined;

  const [fund, setFund] = useState<FundWithTokenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const mountedRef = useRef(true);

  const loadFundData = useCallback(async () => {
    if (!fundId) return;

    try {
      setLoading(true);
      setError(null);

      const parsedId = Number.parseInt(fundId, 10);
      if (Number.isNaN(parsedId) || parsedId < 1) {
        setError("Invalid fund ID.");
        return;
      }

      const fundData = await getFund(parsedId);
      const [revealed, revealRequested, revealedTotal] = await Promise.all([
        isTokenRevealed(parsedId).catch(() => false),
        isRevealRequested(parsedId).catch(() => false),
        getRevealedTotal(parsedId).catch(() => 0n),
      ]);

      if (mountedRef.current) {
        setFund({
          ...fundData,
          tokenStats: { revealed, revealRequested, revealedTotal },
        });
      }
    } catch (loadError: unknown) {
      if (mountedRef.current) {
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load fund.",
        );
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="card border-red-200 p-6 text-red-600">Missing fund ID.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
          <p className="mt-4 text-sm text-brand-muted">Loading campaign…</p>
        </div>
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md border-red-200 p-6 text-center text-red-600">
          {error || "Fund not found."}
        </div>
      </div>
    );
  }

  const phase = getFundPhase(fund);
  const theme = getFundTheme(fund.category);
  const daysRemaining = getDaysRemaining(fund.endTime);
  const shareUrl = getFundShareUrl(fund.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/donate"
          className="inline-flex items-center gap-1 text-sm text-brand-muted transition-colors hover:text-brand-dark"
        >
          <span className="material-icons text-lg">arrow_back</span>
          Back to campaigns
        </Link>
        <span className="rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-muted">
          Fund #{fund.id}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_24rem]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[28px] border border-brand-border bg-white shadow-card">
            <div className={`relative min-h-64 bg-gradient-to-r ${theme.gradient} p-8 md:p-10`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.85),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.55),transparent_30%),radial-gradient(circle_at_65%_75%,rgba(255,255,255,0.2),transparent_35%)] opacity-90" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/90">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1 text-brand-dark shadow-sm">
                    <span className="material-icons text-[13px]" aria-hidden="true">
                      {theme.icon}
                    </span>
                    {fund.category}
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                    {phase === "active"
                      ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`
                      : phase === "upcoming"
                        ? `Starts ${formatFundDate(fund.startTime)}`
                        : "Campaign ended"}
                  </span>
                  {fund.tokenStats.revealRequested && !fund.tokenStats.revealed && (
                    <span className="rounded-full bg-black/15 px-3 py-1 backdrop-blur-sm">
                      Reveal requested
                    </span>
                  )}
                </div>

                <div className="relative z-10 max-w-3xl">
                  <h1 className="heading-balance text-3xl font-extrabold text-white md:text-5xl">
                    {fund.title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85">
                    {fund.description || "No campaign description provided yet."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <FundStats
            donationCount={fund.donationCount}
            goalAmount={fund.goalAmount}
            revealedTotal={fund.tokenStats.revealedTotal}
            revealed={fund.tokenStats.revealed}
            revealRequested={fund.tokenStats.revealRequested}
          />

          <section className="grid gap-6 md:grid-cols-2">
            <div className="card p-6">
              <h2 className="mb-4 text-lg font-bold text-brand-dark">Campaign Facts</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-brand-muted">Recipient</span>
                  <span className="font-mono text-brand-body">
                    {formatWalletAddress(fund.recipient)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-brand-muted">Creator</span>
                  <span className="font-mono text-brand-body">
                    {formatWalletAddress(fund.creator)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-brand-muted">Launches</span>
                  <span className="text-brand-body">{formatFundDateTime(fund.startTime)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-brand-muted">Ends</span>
                  <span className="text-brand-body">{formatFundDateTime(fund.endTime)}</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="mb-4 text-lg font-bold text-brand-dark">Privacy Lifecycle</h2>
              <div className="space-y-3 text-sm">
                {[
                  {
                    label: "Donations stay encrypted",
                    active: true,
                  },
                  {
                    label: "Campaign closes before reveal",
                    active: phase === "ended",
                  },
                  {
                    label: "Admin requests aggregate reveal",
                    active: fund.tokenStats.revealRequested || fund.tokenStats.revealed,
                  },
                  {
                    label: "Only the total becomes public",
                    active: fund.tokenStats.revealed,
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span
                      className={`material-icons text-lg ${
                        item.active ? "text-brand-green" : "text-brand-muted"
                      }`}
                      aria-hidden="true"
                    >
                      {item.active ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    <span className={item.active ? "text-brand-dark" : "text-brand-muted"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-brand-dark">Campaign Actions</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              Share the public campaign page, donate privately, or jump into the
              creator dashboard for reveal and withdrawal actions.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }}
                className="btn-outline px-4 py-3 text-sm"
              >
                {copied ? "Campaign Link Copied" : "Copy Campaign Link"}
              </button>
              <Link href={`/admin?fund=${fund.id}`} className="btn-outline px-4 py-3 text-center text-sm">
                Open Dashboard
              </Link>
            </div>
          </div>

          {phase === "active" ? (
            <DonateCard fundId={fundId} onDonationComplete={loadFundData} />
          ) : phase === "upcoming" ? (
            <div className="card p-8 text-center">
              <span className="material-icons text-4xl text-amber-500">schedule</span>
              <h3 className="mt-3 text-lg font-bold text-brand-dark">Campaign Not Open Yet</h3>
              <p className="mt-2 text-sm text-brand-muted">
                Donations begin on {formatFundDateTime(fund.startTime)}.
              </p>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <span className="material-icons text-4xl text-brand-muted">check_circle</span>
              <h3 className="mt-3 text-lg font-bold text-brand-dark">Campaign Closed</h3>
              <p className="mt-2 text-sm text-brand-muted">
                Donations are closed. If a reveal is requested, only the aggregate total becomes public.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
