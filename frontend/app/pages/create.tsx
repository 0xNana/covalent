"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { createFund } from "@/app/lib/contract";

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

    setLoading(true);

    try {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now + 60; // Start 1 minute from now
      const endTime = now + parseInt(durationDays, 10) * 86400;

      const fundId = await createFund({
        title: title.trim(),
        description: description.trim(),
        recipient,
        startTime,
        endTime,
      });

      setCreatedFundId(fundId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create fund";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (createdFundId !== null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Fund Created!</h2>
            <p className="text-gray-600 mb-2">Your fund ID is:</p>
            <p className="text-4xl font-bold text-indigo-600 mb-6">{createdFundId}</p>
            <p className="text-sm text-gray-500 mb-6">
              Share this ID with donors so they can contribute. Donations will be accepted
              once the fund start time is reached.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push(`/fund/${createdFundId}`)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
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
                className="px-6 py-2.5 bg-white text-gray-700 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create a Fund</h1>
          <p className="mt-2 text-gray-600">
            Set up a confidential donation fund for your cause.
          </p>
        </div>

        {!isConnected && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">
            Please connect your wallet to create a fund.
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Fund Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Support Independent Journalism"
              disabled={loading || !isConnected}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe the purpose of this fund..."
              disabled={loading || !isConnected}
            />
          </div>

          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Address *
            </label>
            <input
              id="recipient"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              placeholder="0x..."
              disabled={loading || !isConnected}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              The Ethereum address that will receive the funds
            </p>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (days)
            </label>
            <input
              id="duration"
              type="number"
              min="1"
              max="365"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading || !isConnected}
            />
            <p className="mt-1 text-xs text-gray-500">
              Fund will be active for this many days after creation
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isConnected}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating Fund..." : "Create Fund"}
          </button>
        </form>

        <div className="mt-6 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <h3 className="text-sm font-semibold text-indigo-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-indigo-800 space-y-1 list-disc list-inside">
            <li>Your fund is created on-chain and becomes immutable</li>
            <li>You automatically become the fund administrator</li>
            <li>Share the fund ID with donors to accept encrypted contributions</li>
            <li>After the fund ends, you can reveal the aggregated total and withdraw</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
