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
      setError("Invalid recipient address");
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
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="card p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-brand-green-light rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-brand-green text-3xl">
              check_circle
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-brand-dark mb-1">
            Fund Created!
          </h2>
          <p className="text-brand-muted text-sm mb-2">Your fund ID is</p>
          <p className="text-5xl font-black text-brand-green mb-6">
            {createdFundId}
          </p>
          <p className="text-sm text-brand-muted mb-6">
            Share this ID with donors so they can contribute to your fund.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(`/fund/${createdFundId}`)}
              className="btn-primary px-6 py-3 text-sm"
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
              className="btn-outline px-6 py-3 text-sm"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-brand-dark mb-1">
          Start a Fund
        </h1>
        <p className="text-brand-muted text-sm">
          Set up a fundraiser where donations are private.
        </p>
      </div>

      {/* Connect prompt */}
      {!isConnected && (
        <div className="card border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 flex items-center gap-3 mb-6">
          <span className="material-icons text-lg">
            account_balance_wallet
          </span>
          Please connect your wallet to create a fund.
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-2">
            Fund Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="e.g., Support Independent Journalism"
            disabled={loading || !isConnected}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-field resize-none"
            placeholder="Describe the purpose of this fund..."
            disabled={loading || !isConnected}
          />
        </div>

        {/* Recipient */}
        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-2">
            Recipient Address *
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="input-field font-mono text-sm"
            placeholder="0x..."
            disabled={loading || !isConnected}
            required
          />
          <p className="mt-1 text-xs text-brand-muted">
            The wallet that will receive the funds
          </p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-2">
            Duration (days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="input-field"
            disabled={loading || !isConnected}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 py-3 px-4 bg-red-50 rounded-lg border border-red-200">
            <span className="material-icons text-red-500 text-sm">error</span>
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !isConnected}
          className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
