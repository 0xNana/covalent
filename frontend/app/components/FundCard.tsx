"use client";

import Link from "next/link";

import type { FundData } from "@/app/lib/contract";
import {
  formatFundDate,
  formatUsdtAmount,
  getDaysRemaining,
  getFundPhase,
  getFundTheme,
} from "@/app/lib/fund-ui";

export default function FundCard({
  fund,
  selected = false,
  onSelect,
  compact = false,
}: {
  fund: FundData;
  selected?: boolean;
  onSelect?: (fundId: number) => void;
  compact?: boolean;
}) {
  const theme = getFundTheme(fund.category);
  const phase = getFundPhase(fund);
  const daysRemaining = getDaysRemaining(fund.endTime);

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-card transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-card-hover ${
        selected ? "border-brand-green shadow-card-hover" : "border-brand-border"
      }`}
    >
      <div className={`relative h-36 bg-gradient-to-r ${theme.gradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.85),transparent_35%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.6),transparent_30%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.25),transparent_35%)] opacity-80" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1 text-[11px] font-bold text-brand-dark shadow-sm">
            <span className="material-icons text-[13px]" aria-hidden="true">
              {theme.icon}
            </span>
            {theme.badge}
          </span>
          <span className="rounded-full border border-white/35 bg-black/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            #{fund.id}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/95">
            <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
              {phase === "active"
                ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`
                : phase === "upcoming"
                  ? `Starts ${formatFundDate(fund.startTime)}`
                  : "Campaign closed"}
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
              {fund.donationCount} donor{fund.donationCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="heading-balance text-xl font-extrabold text-brand-dark">
            {fund.title}
          </h3>
          <p className={`leading-relaxed text-brand-muted ${compact ? "text-sm" : "text-sm"}`}>
            {fund.description || "No campaign description provided yet."}
          </p>
        </div>

        <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
          <div className={`rounded-xl border px-4 py-3 ${theme.surfaceClass}`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">
              Goal
            </p>
            <p className={`mt-1 text-lg font-extrabold ${theme.accentClass}`}>
              {formatUsdtAmount(fund.goalAmount)}
            </p>
          </div>
          <div className="rounded-xl border border-brand-border bg-gray-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">
              Privacy Status
            </p>
            <p className="mt-1 text-sm font-semibold text-brand-dark">
              Total stays encrypted until reveal
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={`/fund/${fund.id}`}
            className="btn-outline inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm sm:w-auto"
          >
            <span className="material-icons text-base" aria-hidden="true">
              visibility
            </span>
            View Details
          </Link>
          {onSelect ? (
            <button
              type="button"
              onClick={() => onSelect(fund.id)}
              className="btn-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm sm:w-auto"
            >
              <span className="material-icons text-base" aria-hidden="true">
                favorite
              </span>
              {selected ? "Selected" : "Donate to This Fund"}
            </button>
          ) : (
            <Link
              href={`/donate?fund=${fund.id}`}
              className="btn-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm sm:w-auto"
            >
              <span className="material-icons text-base" aria-hidden="true">
                favorite
              </span>
              Quick Donate
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
