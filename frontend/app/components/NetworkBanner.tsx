"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

export default function NetworkBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chainId === sepolia.id) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="border-b border-amber-200 bg-amber-50 text-amber-900"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <span className="material-icons text-lg text-amber-600" aria-hidden="true">
            sync_problem
          </span>
          <p className="leading-relaxed">
            Browsing still works, but donating, creating, shielding, and admin actions
            require the Sepolia network.
          </p>
        </div>
        <button
          type="button"
          onClick={() => switchChain({ chainId: sepolia.id })}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Switching…" : "Switch to Sepolia"}
        </button>
      </div>
    </div>
  );
}
