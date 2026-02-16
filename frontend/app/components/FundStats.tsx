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
  encryptedTotal,
  donationCount,
  revealedTotal = 0,
  revealed = false,
  tokenSymbol = "cUSDT",
}: FundStatsProps) {
  const isEncryptedNonZero =
    encryptedTotal && encryptedTotal !== "0x" + "0".repeat(64);

  // Format revealed total from raw (6 decimals) to human-readable
  const formattedTotal = revealed
    ? (revealedTotal / USDT_DECIMALS_DIVISOR).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  return (
    <div className="bg-lighter-slate rounded-2xl p-8 border border-white/5 card-shadow">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="material-icons text-primary-blue">analytics</span>
          Fund Statistics
        </h2>
        <span className="text-xs font-bold text-primary-purple bg-primary-purple/10 px-3 py-1 rounded-full uppercase tracking-wider">
          Private
        </span>
      </div>

      {/* Main stats row */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wide">
            Total Raised
          </p>
          {revealed && formattedTotal ? (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">
                ${formattedTotal}
              </span>
              <span className="material-icons text-emerald-400 text-2xl">
                check_circle
              </span>
            </div>
          ) : (
            <span className="text-4xl font-extrabold text-white font-mono tracking-widest">
              ********
            </span>
          )}
        </div>
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wide">
            Donors
          </p>
          <span className="text-4xl font-extrabold text-white">
            {donationCount}
          </span>
        </div>
      </div>

      {/* Encrypted total display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-deep-slate/50 p-4 rounded-xl border border-white/5">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">
            Encrypted Total
          </p>
          {isEncryptedNonZero && encryptedTotal ? (
            <p className="text-sm font-mono text-primary-blue truncate">
              {encryptedTotal.substring(0, 14)}...
            </p>
          ) : (
            <p className="text-sm font-mono text-slate-600">No donations yet</p>
          )}
        </div>
        <div className="bg-deep-slate/50 p-4 rounded-xl border border-white/5">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">
            Status
          </p>
          <p className="text-sm font-bold">
            {revealed ? (
              <span className="text-emerald-400">Revealed</span>
            ) : (
              <span className="text-primary-purple">Encrypted</span>
            )}
          </p>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
        <span className="material-icons text-primary-purple">security</span>
        <p className="text-sm text-slate-300">
          Individual donation amounts are private. Only the combined total
          can be revealed by the fund admin.
        </p>
      </div>
    </div>
  );
}
