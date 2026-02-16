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

export default function DonateCard({
  fundId,
  onDonationComplete,
}: DonateCardProps) {
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
      setError("Please enter a valid amount");
      return;
    }

    const parsedFundId = parseInt(fundId, 10);
    if (isNaN(parsedFundId) || parsedFundId < 1) {
      setError("Invalid fund ID");
      return;
    }

    setLoading(true);

    try {
      await encryptAndDonate(
        parsedFundId,
        donationAmount,
        address,
        (step) => {
          setCurrentStep(step);
        },
      );
      setSuccess(true);
      setAmount("");
      setCurrentStep("");
      if (onDonationComplete) onDonationComplete();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit donation";
      setError(message);
      setCurrentStep("");
    } finally {
      setLoading(false);
    }
  };

  const activeStepIndex = getStepIndex(currentStep);

  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold text-brand-dark mb-1">
        Make a Donation
      </h2>
      <p className="text-xs text-brand-muted mb-5">
        Your amount stays private — always.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-2">
            Amount (USDT)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-brand-muted">
              $
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field pl-9 pr-16 text-2xl font-bold h-14"
              placeholder="0"
              disabled={loading || !isConnected}
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-muted">
              USDT
            </span>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((qa) => (
            <button
              key={qa}
              type="button"
              onClick={() => setAmount(String(qa))}
              className={`py-2 rounded-lg border text-sm font-semibold transition-all ${
                amount === String(qa)
                  ? "border-brand-green bg-brand-green-light text-brand-green"
                  : "border-brand-border text-brand-muted hover:bg-gray-50"
              }`}
              disabled={loading}
            >
              ${qa}
            </button>
          ))}
        </div>

        {/* Privacy indicator */}
        {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
          <div className="bg-brand-green-light rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="material-icons text-brand-green text-lg">
              lock
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-green">
                Amount will be private
              </p>
              <p className="text-xs text-green-600/80">
                Nobody will see how much you donated
              </p>
            </div>
          </div>
        )}

        {/* Step Progress */}
        {loading && (
          <div className="bg-gray-50 p-4 rounded-lg border border-brand-border">
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((step, i) => (
                <div key={step.id} className="flex items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i < activeStepIndex
                        ? "bg-brand-green text-white"
                        : i === activeStepIndex
                          ? "bg-brand-green text-white animate-pulse"
                          : "bg-gray-200 text-brand-muted"
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
                        i < activeStepIndex ? "bg-brand-green" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-brand-body">{currentStep}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 py-3 px-4 bg-red-50 rounded-lg border border-red-200">
            <span className="material-icons text-red-500 text-sm">error</span>
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center justify-center gap-2 py-4 px-4 bg-brand-green-light rounded-lg border border-green-200">
            <span className="material-icons text-brand-green">
              check_circle
            </span>
            <span className="text-sm font-bold text-brand-green">
              Donation successful! Thank you.
            </span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !isConnected}
          aria-busy={loading}
          aria-label={loading ? "Processing donation" : "Donate privately"}
          className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-icons">favorite</span>
          {loading ? "Processing..." : "Donate Now"}
        </button>

        {/* Trust line */}
        <p className="text-center text-xs text-brand-muted flex items-center justify-center gap-1">
          <span className="material-icons text-xs">lock</span>
          Your donation amount is always private
        </p>
      </form>
    </div>
  );
}
