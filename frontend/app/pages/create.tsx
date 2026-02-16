"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { createFund } from "@/app/lib/contract";

const START_DELAY_SECONDS = 60;
const SECONDS_PER_DAY = 86_400;
const MS_PER_SECOND = 1_000;

export default function CreateFundPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdFundId, setCreatedFundId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!title.trim() || !recipient.trim()) {
      setError("Title and recipient address are required");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setError("Invalid recipient Ethereum address");
      return;
    }

    const parsedDuration = parseInt(durationDays, 10);
    if (isNaN(parsedDuration) || parsedDuration < 1 || parsedDuration > 365) {
      setError("Duration must be between 1 and 365 days");
      return;
    }

    setLoading(true);

    try {
      const now = Math.floor(Date.now() / MS_PER_SECOND);
      const startTime = now + START_DELAY_SECONDS;
      const endTime = now + parsedDuration * SECONDS_PER_DAY;

      const fundId = await createFund({
        title: title.trim(),
        description: description.trim(),
        recipient,
        startTime,
        endTime,
      });

      setCreatedFundId(fundId);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create fund";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (createdFundId !== null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-lighter-slate rounded-2xl border border-white/10 p-12 card-shadow text-center max-w-lg w-full">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-icons text-emerald-400 text-3xl">
              check_circle
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">
            Fund Created!
          </h2>
          <p className="text-slate-400 mb-2">Your fund ID is:</p>
          <p className="text-5xl font-black gradient-text mb-6">
            {createdFundId}
          </p>
          <p className="text-sm text-slate-500 mb-8">
            Share this ID with donors so they can contribute. Donations will be
            accepted once the fund start time is reached.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(`/fund/${createdFundId}`)}
              className="px-8 py-3 gradient-btn text-white rounded-xl font-bold"
            >
              View Fund
            </button>
            <button
              onClick={() => {
                setCreatedFundId(null);
                setTitle("");
                setDescription("");
                setRecipient("");
              }}
              className="px-8 py-3 bg-white/5 text-white rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-white mb-2">
          Create a Fund
        </h1>
        <p className="text-slate-400">
          Set up a confidential donation fund for your cause.
        </p>
      </div>

      {/* Connect prompt */}
      {!isConnected && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-6 py-4 rounded-xl text-sm flex items-center gap-3 mb-8">
          <span className="material-icons text-lg">
            account_balance_wallet
          </span>
          Please connect your wallet to create a fund.
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-lighter-slate rounded-2xl border border-white/10 p-8 card-shadow space-y-6"
      >
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-3">
            Fund Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-deep-slate border-2 border-white/10 rounded-xl px-6 py-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue outline-none transition-all"
            placeholder="e.g., Support Independent Journalism"
            disabled={loading || !isConnected}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-3">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-deep-slate border-2 border-white/10 rounded-xl px-6 py-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue outline-none transition-all resize-none"
            placeholder="Describe the purpose of this fund..."
            disabled={loading || !isConnected}
          />
        </div>

        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-3">
            Recipient Address *
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full bg-deep-slate border-2 border-white/10 rounded-xl px-6 py-4 font-mono text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue outline-none transition-all"
            placeholder="0x..."
            disabled={loading || !isConnected}
            required
          />
          <p className="mt-1.5 text-[11px] text-slate-500">
            The Ethereum address that will receive the funds
          </p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-3">
            Duration (days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="w-full bg-deep-slate border-2 border-white/10 rounded-xl px-6 py-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue outline-none transition-all"
            disabled={loading || !isConnected}
          />
          <p className="mt-1.5 text-[11px] text-slate-500">
            Fund will be active for this many days after creation
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 py-3 px-4 bg-red-500/10 rounded-xl border border-red-500/20">
            <span className="material-icons text-red-400 text-sm">error</span>
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !isConnected}
          className="w-full gradient-btn text-white py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Fund...
            </>
          ) : (
            <>
              <span className="material-icons">add_circle</span>
              Create Fund
            </>
          )}
        </button>
      </form>

    </div>
  );
}
