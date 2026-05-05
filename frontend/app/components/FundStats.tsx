"use client";

import { formatUsdtAmount } from "@/app/lib/fund-ui";

interface FundStatsProps {
  donationCount: number;
  goalAmount: bigint;
  revealedTotal?: bigint;
  revealed?: boolean;
  revealRequested?: boolean;
}

export default function FundStats({
  donationCount,
  goalAmount,
  revealedTotal = 0n,
  revealed = false,
  revealRequested = false,
}: FundStatsProps) {
  const progressPercent =
    goalAmount > 0n && revealed
      ? Number((revealedTotal * 10000n) / goalAmount) / 100
      : 0;

  return (
    <div className="card p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-brand-border bg-gray-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">
            Goal
          </p>
          <p className="mt-1 text-2xl font-extrabold text-brand-dark">
            {formatUsdtAmount(goalAmount)}
          </p>
        </div>

        <div className="rounded-2xl border border-brand-border bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">
            Raised
          </p>
          {revealed ? (
            <p className="mt-1 text-2xl font-extrabold text-brand-green">
              {formatUsdtAmount(revealedTotal)}
            </p>
          ) : (
            <div>
              <p className="mt-1 font-mono text-2xl font-black tracking-[0.25em] text-brand-dark">
                ****
              </p>
              <p className="mt-1 text-xs text-brand-muted">Encrypted until reveal</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-brand-border bg-gray-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">
            Donors
          </p>
          <p className="mt-1 text-2xl font-extrabold text-brand-dark">
            {donationCount}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-200 bg-brand-green-light p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-brand-green">
            {revealed
              ? `Campaign progress: ${Math.min(progressPercent, 100).toFixed(2)}% of goal revealed`
              : revealRequested
                ? "Reveal requested. Waiting for proof-verified total."
                : "Campaign total is still confidential."}
          </p>
          <span className="material-icons text-brand-green" aria-hidden="true">
            {revealed ? "check_circle" : revealRequested ? "hourglass_top" : "lock"}
          </span>
        </div>
        {revealed && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
            <div
              className="h-full rounded-full bg-brand-green transition-[width] duration-300"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
