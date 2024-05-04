'use  client'
import { NextPage } from "next";
import { ReactNode, createContext } from "react";
import {
  useAccount,
  useBalance,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { Client, PublicClient, WalletClient, http } from "viem";
import {sepolia} from 'wagmi/chains'
export type Deployement = {
  address: string;
  j1: string;
  j2?: string;
};

import { GetBalanceData } from "wagmi/query";
//Global contexts may be persisted and managed here

export type WalletContextType = {
  publicClient: PublicClient | undefined;
  client: WalletClient | undefined;
  balance: GetBalanceData | undefined;
  address: `0x${string}` | undefined;
};

export const WalletContext = createContext<WalletContextType | null>(null);

const WalletProvider: NextPage<{ children: ReactNode }> = ({
  children,
}) => {
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { data: client } = useWalletClient();
  const { address } = useAccount();
const { data: balance } = useBalance({address});
  return (
    <WalletContext.Provider
      value={{
        publicClient,
        client,
        balance,
        address,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;
