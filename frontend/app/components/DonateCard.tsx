"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { encryptAndDonate } from "@/app/lib/encryption";

interface DonateCardProps {
  fundId: string;
  onDonationComplete?: () => void;
}

const QUICK_AMOUNTS = [25, 100, 500, 1000];

const STEPS = [
  { id: "approve", label: "Approve" },
  { id: "wrap", label: "Prepare" },
  { id: "encrypt", label: "Protect" },
  { id: "donate", label: "Donate" },
];

export default function DonateCard({ fundId, onDonationComplete }: DonateCardProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");

  const getStepIndex = (step: string): number => {
    if (step.includes("allowance") || step.includes("Approving")) return 0;
    if (step.includes("Wrapping")) return 1;
    if (step.includes("Encrypting")) return 2;
    if (step.includes("Submitting")) return 3;
    return -1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    const donationAmount = parseInt(amount, 10);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      setError("Please enter a valid positive amount in USDT");
      return;
    }

    const parsedFundId = parseInt(fundId, 10);
    if (isNaN(parsedFundId) || parsedFundId < 1) {
      setError("Invalid fund ID");
      return;
    }

    setLoading(true);

    try {
      await encryptAndDonate(parsedFundId, donationAmount, address, (step) => {
        setCurrentStep(step);
      });
      setSuccess(true);
      setAmount("");
      setCurrentStep("");
      if (onDonationComplete) onDonationComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit donation";
      setError(message);
      setCurrentStep("");
    } finally {
      setLoading(false);
    }
  };

  const activeStepIndex = getStepIndex(currentStep);

  return (
    <div className="bg-lighter-slate rounded-2xl p-8 border border-white/10 card-shadow relative overflow-hidden">
      {/* Live badge */}
      <div className="absolute top-0 right-0 p-4">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
            Private
          </span>
        </div>
      </div>

      <div className="mb-8">
        <span className="text-primary-purple font-bold text-sm tracking-wider uppercase">
          Your Contribution
        </span>
        <h2 className="text-2xl font-bold text-white mt-1">Make a Donation</h2>
        <p className="text-xs text-slate-500 mt-1">Your amount is encrypted before it reaches the blockchain</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Input */}
        <div>
          <label className="block text-slate-400 text-sm font-medium mb-3">
            Amount (USDT)
          </label>
          <div className="relative group">
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-deep-slate border-2 border-white/10 rounded-xl py-5 pl-6 pr-16 text-3xl font-bold text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary-blue/50 focus:border-primary-blue transition-all outline-none"
              placeholder="0"
              disabled={loading || !isConnected}
              required
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
              USDT
            </span>
          </div>
        </div>

        {/* Encrypted Preview */}
        {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
          <div className="bg-deep-slate p-5 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-slate-400 text-sm">Privacy Preview</label>
              <span className="text-[10px] bg-primary-blue/20 text-primary-blue px-1.5 py-0.5 rounded">
                Protected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-icons text-primary-blue text-sm">lock</span>
              <span className="font-mono text-xl text-primary-blue tracking-widest">
                ********
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 italic">
              Your exact amount will be hidden on-chain. Only the combined
              total for the fund can ever be revealed.
            </p>
          </div>
        )}

        {/* Quick amounts */}
        <div className="grid grid-cols-4 gap-3">
          {QUICK_AMOUNTS.map((qa) => (
            <button
              key={qa}
              type="button"
              onClick={() => setAmount(String(qa))}
              className={`py-2.5 rounded-lg border text-sm font-bold transition-all ${
                amount === String(qa)
                  ? "border-primary-blue/40 bg-primary-blue/10 text-primary-blue"
                  : "border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20"
              }`}
              disabled={loading}
            >
              ${qa}
            </button>
          ))}
        </div>

        {/* Step Progress */}
        {loading && (
          <div className="bg-deep-slate p-4 rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((step, i) => (
                <div key={step.id} className="flex items-center gap-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i < activeStepIndex
                        ? "bg-emerald-500 text-white"
                        : i === activeStepIndex
                          ? "bg-primary-blue text-white animate-pulse"
                          : "bg-white/5 text-slate-500"
                    }`}
                  >
                    {i < activeStepIndex ? (
                      <span className="material-icons text-xs">check</span>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`w-8 h-0.5 ${
                        i < activeStepIndex ? "bg-emerald-500" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-slate-300">{currentStep}</span>
            </div>
          </div>
        )}

        {/* Status messages */}
        {error && (
          <div className="flex items-center gap-2 py-3 px-4 bg-red-500/10 rounded-xl border border-red-500/20">
            <span className="material-icons text-red-400 text-sm">error</span>
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <span className="text-sm font-bold text-emerald-400">
              Donation Successful
            </span>
            <span className="material-icons text-emerald-400 text-sm">check_circle</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !isConnected}
          aria-busy={loading}
          aria-label={loading ? "Processing donation" : "Donate privately"}
          className="w-full gradient-btn text-white py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="material-icons">lock</span>
          {loading ? "Processing..." : "Donate Privately"}
        </button>

        {/* Trust badges */}
        <div className="flex justify-center gap-6">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="material-icons text-sm">verified_user</span>
            Verified
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="material-icons text-sm">lock</span>
            Encrypted
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="material-icons text-sm">visibility_off</span>
            Anonymous
          </div>
        </div>
      </form>
    </div>
  );
}
