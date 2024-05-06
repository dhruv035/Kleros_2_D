"use  client";
import { NextPage } from "next";
import { ReactNode, createContext, useEffect, useState } from "react";
import {
  useAccount,
  useAccountEffect,
  useBalance,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { Client, PublicClient, WalletClient, http } from "viem";
import { sepolia } from "wagmi/chains";
export type Deployment = {
  address: string;
  j1: string;
  j2?: string;
};

import { GetBalanceData } from "wagmi/query";
import { usePathname, useRouter } from "next/navigation";
//Global contexts may be persisted and managed here

export type WalletContextType = {
  publicClient: PublicClient | undefined;
  client: WalletClient | undefined;
  balance: GetBalanceData | undefined;
  address: `0x${string}` | undefined;
  isConnected: boolean;
};

export const WalletContext = createContext<WalletContextType | null>(null);

const WalletProvider: NextPage<{ children: ReactNode }> = ({ children }) => {
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { data: client } = useWalletClient();
  const { address } = useAccount();
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("isConnected") === "true";
    } else return false;
  });
  useAccountEffect({
    onConnect(data) {
      if (isConnected !== true) {
        setIsConnected(true);
        localStorage.setItem("isConnected", "true");
      }
    },
    onDisconnect() {
      if (isConnected !== false) {
        setIsConnected(false);
        localStorage.setItem("isConnected", "false");
      }
    },
  });
  const { data: balance } = useBalance({ address });
  return (
    <WalletContext.Provider
      value={{
        publicClient,
        client,
        balance,
        address,
        isConnected,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;
