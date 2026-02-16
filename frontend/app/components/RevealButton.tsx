"use client";

import { useState } from "react";
import { requestReveal } from "@/app/lib/contract";

interface RevealButtonProps {
  fundId: number;
  onReveal?: (fundId: number) => void;
}

export default function RevealButton({ fundId, onReveal }: RevealButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReveal = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await requestReveal(fundId);
      setSuccess(true);

      if (onReveal) {
        onReveal(fundId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to request reveal";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleReveal}
        disabled={loading || success}
        className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Requesting...
          </>
        ) : success ? (
          "Reveal Requested"
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            Request Reveal
          </>
        )}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {success && (
        <p className="mt-2 text-sm text-green-600">
          Reveal requested. MCP will decrypt the aggregated total.
        </p>
      )}
    </div>
  );
}
