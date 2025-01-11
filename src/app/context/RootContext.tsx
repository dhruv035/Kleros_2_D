"use client";

import { ReactNode } from "react";
import TransactionProvider from "./TransactionContext";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { sepolia } from "viem/chains";
import "@rainbow-me/rainbowkit/styles.css";
import { http } from "viem";

const queryClient = new QueryClient();

// Customize sepolia with Alchemy RPC
const customSepolia = {
  ...sepolia,
  rpcUrls: {
    default: {
      http: [`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`],
    },
    public: {
      http: [`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`],
    },
  },
};

const config = getDefaultConfig({
  appName: "Rock Paper Scissors Lizard Spock",
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID as string,
  chains: [customSepolia],
  ssr: true,
  transports: {
    [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`),
  },
});

const RootProvider = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <TransactionProvider>{children}</TransactionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default RootProvider;
