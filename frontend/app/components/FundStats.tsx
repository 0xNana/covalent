"use client";

const USDT_DECIMALS_DIVISOR = 1_000_000;

interface FundStatsProps {
  encryptedTotal: string | null;
  donationCount: number;
  revealedTotal?: number;
  revealed?: boolean;
  tokenSymbol?: string;
}

export default function FundStats({
  donationCount,
  revealedTotal = 0,
  revealed = false,
}: FundStatsProps) {
  const formattedTotal = revealed
    ? (revealedTotal / USDT_DECIMALS_DIVISOR).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : null;

  return (
    <div className="card p-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Total raised */}
        <div>
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">
            Total Raised
          </p>
          {revealed && formattedTotal ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-brand-green">
                ${formattedTotal}
              </span>
              <span className="material-icons text-brand-green text-lg">
                check_circle
              </span>
            </div>
          ) : (
            <div>
              <span className="text-3xl font-extrabold text-brand-dark font-mono tracking-wider">
                ****
              </span>
              <p className="text-xs text-brand-muted mt-1">Private</p>
            </div>
          )}
        </div>

        {/* Donors */}
        <div>
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">
            Donors
          </p>
          <span className="text-3xl font-extrabold text-brand-dark">
            {donationCount}
          </span>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="mt-5 flex items-center gap-2 p-3 bg-brand-green-light rounded-lg">
        <span className="material-icons text-brand-green text-sm">lock</span>
        <p className="text-xs text-green-700">
          Individual donation amounts are always private.
        </p>
      </div>
    </div>
  );
}
