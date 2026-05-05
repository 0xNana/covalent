"use client";

import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { useState } from "react";

import { formatWalletAddress } from "@/app/lib/fund-ui";

export default function WalletConnect({ compact = false }: { compact?: boolean }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = () => {
    setError(null);
    try {
      connect(
        { connector: injected() },
        {
          onError: (err) => {
            setError(err.message || "Failed to connect wallet");
          },
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  };

  const handleDisconnect = () => {
    try {
      disconnect();
    } catch {
      // Disconnect errors are non-critical
    }
  };

  if (isConnected && address) {
    const onExpectedNetwork = chainId === sepolia.id;

    if (compact) {
      return (
        <button
          onClick={handleDisconnect}
          title={
            onExpectedNetwork
              ? `Connected: ${formatWalletAddress(address)}`
              : `Wrong network: ${formatWalletAddress(address)}`
          }
          aria-label={`Disconnect wallet ${formatWalletAddress(address)}`}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-gray-50 text-brand-dark transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              onExpectedNetwork ? "bg-brand-green" : "bg-amber-500"
            }`}
          />
        </button>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span
          className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${
            onExpectedNetwork
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {onExpectedNetwork ? "Sepolia" : "Wrong Network"}
        </span>
        <button
          onClick={handleDisconnect}
          aria-label={`Disconnect wallet ${formatWalletAddress(address)}`}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-gray-50 px-4 py-2 text-sm transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              onExpectedNetwork ? "bg-brand-green" : "bg-amber-500"
            }`}
          />
          <span className="font-mono text-xs text-brand-muted">
            {formatWalletAddress(address)}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!compact && error && (
        <span
          aria-live="polite"
          className="text-xs text-red-500 max-w-[150px] truncate"
          title={error}
        >
          {error}
        </span>
      )}
      <button
        onClick={handleConnect}
        aria-label="Log in with wallet"
        title={compact ? "Connect wallet" : undefined}
        className={`btn-primary flex items-center gap-2 text-sm ${
          compact ? "h-11 w-11 justify-center px-0 py-0" : "px-5 py-2.5"
        }`}
      >
        <span className="material-icons text-sm">account_balance_wallet</span>
        {!compact ? "Log In" : null}
      </button>
    </div>
  );
}
