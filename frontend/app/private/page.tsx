"use client";

import { useAccount } from "wagmi";
import TokenManager from "@/app/components/TokenManager";

export default function PrivatePage() {
  const { isConnected } = useAccount();

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-brand-dark mb-1">
          Make Private
        </h1>
        <p className="text-brand-muted text-sm">
          Convert USDT to private tokens for anonymous donations, or withdraw
          back to USDT anytime.
        </p>
      </div>

      {/* Connect wallet prompt */}
      {!isConnected && (
        <div className="card border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 flex items-center gap-3">
          <span className="material-icons text-lg">account_balance_wallet</span>
          Please connect your wallet to manage tokens.
        </div>
      )}

      {/* Token Manager */}
      <TokenManager />

      {/* How it works */}
      <div className="card p-6">
        <h3 className="font-bold text-brand-dark text-sm mb-4">How It Works</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: "arrow_forward",
              title: "Make Private",
              desc: "Convert USDT to private tokens",
            },
            {
              icon: "favorite",
              title: "Donate",
              desc: "Give anonymously to any fund",
            },
            {
              icon: "arrow_back",
              title: "Withdraw",
              desc: "Convert back to USDT anytime",
            },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 rounded-full bg-brand-green-light flex items-center justify-center text-brand-green mx-auto mb-2">
                <span className="material-icons text-lg">{step.icon}</span>
              </div>
              <h4 className="font-bold text-brand-dark text-xs mb-0.5">
                {step.title}
              </h4>
              <p className="text-[11px] text-brand-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
