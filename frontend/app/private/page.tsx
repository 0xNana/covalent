"use client";

import { useAccount } from "wagmi";
import TokenManager from "@/app/components/TokenManager";

export default function PrivatePage() {
  const { isConnected } = useAccount();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-white mb-2">
          Make Private
        </h1>
        <p className="text-slate-400 max-w-lg mx-auto">
          Convert your USDT to private tokens for anonymous donations,
          or withdraw private tokens back to USDT.
        </p>
      </div>

      {/* Connect wallet prompt */}
      {!isConnected && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-6 py-4 rounded-xl text-sm flex items-center gap-3">
          <span className="material-icons text-lg">account_balance_wallet</span>
          Please connect your wallet to manage your tokens.
        </div>
      )}

      {/* Token Manager */}
      <TokenManager />

      {/* How it works */}
      <div className="bg-lighter-slate rounded-2xl p-8 border border-white/5 card-shadow">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="material-icons text-primary-blue">info</span>
          How It Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "arrow_forward",
              title: "Make Private",
              desc: "Convert USDT to private tokens that hide your balance",
            },
            {
              icon: "lock",
              title: "Donate Anonymously",
              desc: "Use private tokens to donate — nobody sees your amount",
            },
            {
              icon: "arrow_back",
              title: "Withdraw",
              desc: "Convert private tokens back to USDT anytime",
            },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-purple/10 flex items-center justify-center text-primary-purple mb-3">
                <span className="material-icons">{step.icon}</span>
              </div>
              <h4 className="font-bold text-white text-sm mb-1">
                {step.title}
              </h4>
              <p className="text-xs text-slate-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
