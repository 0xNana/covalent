"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { encryptAndDonate } from "@/app/lib/encryption";

interface DonateCardProps {
  fundId: string;
  onDonationComplete?: () => void;
}

export default function DonateCard({ fundId, onDonationComplete }: DonateCardProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<string>("");

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
      setError("Please enter a valid positive integer amount");
      return;
    }

    setLoading(true);

    try {
      setStep("Encrypting donation amount...");
      await encryptAndDonate(parseInt(fundId, 10), donationAmount, address);

      setSuccess(true);
      setAmount("");
      setStep("");

      if (onDonationComplete) {
        onDonationComplete();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit donation";
      setError(message);
      setStep("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Donation Amount
        </label>
        <div className="relative">
          <input
            id="amount"
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
            placeholder="Enter amount (integer)"
            disabled={loading || !isConnected}
            required
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-sm">tokens</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Amount is encrypted client-side before submission
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Donation submitted successfully! Your donation amount is encrypted and private.
        </div>
      )}

      {loading && step && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {step}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !isConnected}
        className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Processing..." : "Donate Privately"}
      </button>
    </form>
  );
}
