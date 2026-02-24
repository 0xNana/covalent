"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import DonateCard from "@/app/components/DonateCard";
import { DEMO_FUNDS } from "@/app/lib/donate-funds";

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

      {/* Explore funds */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-brand-dark">Explore Funds</h2>
          <p className="text-sm text-brand-muted">
            Pick a fund to donate privately.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DEMO_FUNDS.map((fund) => (
            <button
              key={fund.id}
              type="button"
              onClick={() => setFundId(String(fund.id))}
              className={`card border text-left transition-colors overflow-hidden flex flex-col h-full ${
                fundId === String(fund.id)
                  ? "border-brand-green bg-brand-green-light/30"
                  : "border-brand-border hover:border-brand-green"
              }`}
              disabled={!isConnected}
            >
              <div
                className={`h-24 w-full bg-gradient-to-r ${fund.theme.gradient} relative`}
              >
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.8),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.6),transparent_40%)]" />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 text-brand-dark text-[10px] font-bold px-2.5 py-1 shadow-sm">
                  <span className="material-icons text-[12px]">
                    {fund.theme.icon}
                  </span>
                  {fund.theme.badge}
                </div>
                <div className="absolute bottom-3 left-3 text-white text-xs font-semibold">
                  Fund ID #{fund.id}
                </div>
              </div>
              <div className="px-4 py-4 flex-1">
                <h3 className="text-sm font-bold text-brand-dark min-h-[2.5rem]">
                  {fund.title}
                </h3>
                <p className="text-xs text-brand-muted mt-2 leading-relaxed min-h-[2.5rem]">
                  {fund.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

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
