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
      if (onReveal) onReveal(fundId);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to request reveal";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleReveal}
        disabled={loading || success}
        className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : success ? (
          <>
            <span className="material-icons">check_circle</span>
            Reveal Requested
          </>
        ) : (
          <>
            <span className="material-icons">visibility</span>
            Reveal Total Raised
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="material-icons text-red-500 text-sm">error</span>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <p className="text-xs text-brand-muted text-center">
          Only the combined total will be shown — individual amounts stay
          private.
        </p>
      )}
    </div>
  );
}
