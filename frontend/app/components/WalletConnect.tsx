"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useState } from "react";

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
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
    return (
      <button
        onClick={handleDisconnect}
        aria-label={`Disconnect wallet ${address.slice(0, 6)}...${address.slice(-4)}`}
        className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-brand-border rounded-lg hover:bg-gray-100 transition-all text-sm"
      >
        <span className="w-2 h-2 rounded-full bg-brand-green" />
        <span className="font-mono text-xs text-brand-muted">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span
          className="text-xs text-red-500 max-w-[150px] truncate"
          title={error}
        >
          {error}
        </span>
      )}
      <button
        onClick={handleConnect}
        aria-label="Connect wallet"
        className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
      >
        <span className="material-icons text-sm">account_balance_wallet</span>
        Connect
      </button>
    </div>
  );
}
