"use client";

interface FundStatsProps {
  encryptedTotal: string | null;
  donationCount: number;
  revealedTotal?: number;
  revealed?: boolean;
}

export default function FundStats({
  encryptedTotal,
  donationCount,
  revealedTotal = 0,
  revealed = false,
}: FundStatsProps) {
  const isEncryptedNonZero = encryptedTotal && encryptedTotal !== "0x" + "0".repeat(64);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Fund Statistics</h3>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Donations</p>
            <p className="text-2xl font-bold text-gray-900">{donationCount}</p>
          </div>
          <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500 mb-2">Encrypted Total</p>
          {isEncryptedNonZero ? (
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm font-mono text-gray-600 truncate">
                {encryptedTotal!.substring(0, 18)}...{encryptedTotal!.substring(encryptedTotal!.length - 8)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No donations yet</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Individual donations remain private forever
          </p>
        </div>

        {revealed && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500 mb-1">Revealed Total</p>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <p className="text-3xl font-bold text-green-600">
                {revealedTotal.toLocaleString()}
              </p>
              <span className="text-sm text-gray-500">tokens</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Aggregated total revealed by authorized administrator
            </p>
          </div>
        )}

        {!revealed && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 text-gray-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">
                Total not yet revealed. Only authorized admins can request.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
