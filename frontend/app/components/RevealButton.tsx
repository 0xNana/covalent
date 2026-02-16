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
        className="w-full gradient-btn glow-blue text-white font-extrabold py-5 px-8 rounded-2xl text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            <span className="material-icons">lock_open</span>
            Reveal Total Raised
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <span className="material-icons text-red-400 text-sm">error</span>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 bg-primary-blue/5 border border-primary-blue/20 rounded-xl">
          <span className="material-icons text-primary-blue mt-0.5">info</span>
          <p className="text-xs text-slate-300 leading-relaxed">
            Reveal requested. Only the combined total will be shown — individual
            donor amounts stay private forever.
          </p>
        </div>
      )}
    </div>
  );
}
