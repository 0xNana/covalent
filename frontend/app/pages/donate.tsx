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
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary-blue font-bold text-sm mb-6">
          <span className="material-icons text-sm mr-2">verified_user</span>
          100% Private Giving
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2">
          Make a Private Donation
        </h1>
        <p className="text-slate-400">
          Your contribution is protected before being sent to the
          blockchain. Nobody sees how much you gave.
        </p>
      </div>

      {/* Connect wallet prompt */}
      {!isConnected && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-6 py-4 rounded-xl text-sm flex items-center gap-3">
          <span className="material-icons text-lg">account_balance_wallet</span>
          Please connect your wallet to make a donation.
        </div>
      )}

      {/* Fund ID selector */}
      <div className="bg-lighter-slate rounded-2xl border border-white/10 p-8 card-shadow">
        <div className="max-w-xl mx-auto">
          <label className="block text-sm font-medium text-slate-400 mb-3">
            Select a Fund
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <input
                type="number"
                min="1"
                step="1"
                value={fundId}
                onChange={(e) => setFundId(e.target.value)}
                className="w-full bg-deep-slate border-2 border-white/10 rounded-xl px-6 py-4 text-xl font-mono text-white focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue outline-none transition-all placeholder:text-slate-700"
                placeholder="Enter fund ID"
                disabled={!isConnected}
              />
            </div>
            {fundId && (
              <button
                onClick={() => router.push(`/fund/${fundId}`)}
                className="px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all font-bold text-sm"
              >
                View Fund Details
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Donate form */}
      {fundId && <DonateCard fundId={fundId} />}

      {/* How it works */}
      <div className="bg-lighter-slate rounded-2xl p-8 border border-white/5 card-shadow">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="material-icons text-primary-blue">info</span>
          How it Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              icon: "edit",
              title: "Enter Amount",
              desc: "Type your donation amount",
            },
            {
              icon: "lock",
              title: "Amount Hidden",
              desc: "Your amount is protected",
            },
            {
              icon: "cloud_upload",
              title: "Submit On-Chain",
              desc: "Securely sent to the fund",
            },
            {
              icon: "visibility_off",
              title: "Stay Private",
              desc: "Nobody sees your amount",
            },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-blue/10 flex items-center justify-center text-primary-blue mb-3">
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

      {/* Security note */}
      <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest leading-relaxed">
        SECURED BY END-TO-END ENCRYPTION
        <br />
        YOUR PRIVACY IS GUARANTEED
      </p>
    </div>
  );
}
