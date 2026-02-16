"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState, useEffect } from "react";
import { initFHEVM } from "@/app/lib/fheClient";

const config = createConfig({
  chains: [hardhat, sepolia],
  transports: {
    [hardhat.id]: http("http://localhost:8545"),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
});

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    initFHEVM().catch(console.error);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
