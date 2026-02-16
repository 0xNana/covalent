"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
});

/**
 * App-level providers (wagmi + react-query).
 *
 * FHE SDK is NOT initialized here — it's initialized lazily on first use
 * (inside encryptAndDonate / TokenManager) so the app loads cleanly even
 * when the wallet isn't connected or isn't on Sepolia yet.
 */
export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
