"use client";

import "@rainbow-me/rainbowkit/styles.css";
import React, { ReactNode } from "react";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
  Chain,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import {
  sepolia,
} from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import TransactionProvider from "./TransactionContext";
import WalletProvider from "./WalletContext";

// Setup queryClient
const customSepolia = { ...sepolia } as Chain;

export function ContextProvider({children }: { children: ReactNode }) {

  customSepolia.rpcUrls = {
    default: {
      http: [
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
      ],
    },
  };
  const queryClient = new QueryClient();
  const config = getDefaultConfig({
    appName: "My RainbowKit App",
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID ?? "",
    chains: [customSepolia],
    ssr: true, // If your dApp uses server side rendering (SSR)
    
  });
  return (
    <WagmiProvider config={config} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <WalletProvider>
            <TransactionProvider>{children}</TransactionProvider>
          </WalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
