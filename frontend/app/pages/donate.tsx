"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import DonateCard from "@/app/components/DonateCard";

export default function DonatePage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [fundId, setFundId] = useState("");

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-brand-dark mb-1">
          Donate
        </h1>
        <p className="text-brand-muted text-sm">
          Your donation amount is always private.
        </p>
      </div>

      {/* Connect wallet prompt */}
      {!isConnected && (
        <div className="card border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 flex items-center gap-3">
          <span className="material-icons text-lg">account_balance_wallet</span>
          Please connect your wallet to donate.
        </div>
      )}

      {/* Fund ID selector */}
      <div className="card p-6">
        <label className="block text-sm font-semibold text-brand-dark mb-2">
          Fund ID
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            step="1"
            value={fundId}
            onChange={(e) => setFundId(e.target.value)}
            className="input-field flex-1 font-mono"
            placeholder="Enter fund ID"
            disabled={!isConnected}
          />
          {fundId && (
            <button
              onClick={() => router.push(`/fund/${fundId}`)}
              className="btn-outline px-4 py-3 text-sm whitespace-nowrap"
            >
              View Fund
            </button>
          )}
        </div>
      </div>

      {/* Donate form */}
      {fundId && <DonateCard fundId={fundId} />}
    </div>
  );
}
