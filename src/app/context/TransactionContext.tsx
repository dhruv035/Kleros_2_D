"use client";
import { NextPage } from "next";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { addDeployement } from "../services/front-end/deployements";

import { waitForTransactionReceipt } from "viem/actions";
import { WalletContext, WalletContextType } from "./WalletContext";
import { useRouter } from "next/navigation";
import { Alchemy, Network } from "alchemy-sdk";
//Global contexts may be persisted and managed here

export type TransactionContextType = {
  isTxDisabled: boolean;
  pendingTx: `0x${string}` | undefined;

  alchemy: Alchemy;
  setPendingTx: Dispatch<SetStateAction<`0x${string}` | undefined>>;
  setIsTxDisabled: Dispatch<SetStateAction<boolean>>;
  setUpdateData: Dispatch<SetStateAction<UpdateData>>;
};

export type Deployement = {
  address: string;
  j1: string;
  j2?: string;
};

export type UpdateData = {
  j1: string;
  j2: string;
};
export const TransactionContext = createContext<TransactionContextType | null>(
  null
);

const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const { publicClient } = useContext(WalletContext) as WalletContextType;
  const [pendingTx, setPendingTx] = useState<`0x${string}` | undefined>();
  const [isTxDisabled, setIsTxDisabled] = useState<boolean>(false);
  const [updateData, setUpdateData] = useState<UpdateData>({} as UpdateData);
  
  const config = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
    network: Network.ETH_SEPOLIA,
  };
  const alchemy = new Alchemy(config);

  const router = useRouter();
  useEffect(() => {
    if (pendingTx) {
      console.log("PENDINGTX", pendingTx);
      setIsTxDisabled(true);
      (async () => {
        if (!publicClient) return;

        console.log("STARTING");
        const result = await waitForTransactionReceipt(publicClient, {
          hash: pendingTx as `0x${string}`,
        });

        console.log("RESULT", result);
        console.log("UPDATEDATA",updateData)
        if (result.status === "success") {
          console.log("SUCCESS", result);
          if (result.to === null) {
            console.log("1");
            if (!result.from || !result.contractAddress) return;
            console.log("2");
            const updation = await addDeployement({
              address: result.contractAddress as string,
              ...updateData,
            });

            router.push("/");
          }
        } else if (result.status === "reverted") {
          console.log("Error", result);
        }
        setIsTxDisabled(false);
        setPendingTx(undefined);
        localStorage.setItem("pendingTx", "");
        setUpdateData({} as UpdateData);
      })();
    } else {
      const abc = localStorage.getItem("pendingTx");
      if (abc && abc !== "") {
        setPendingTx(abc as `0x${string}`);
      }
      setIsTxDisabled(false);
    }
  }, [pendingTx]);

  return (
    <TransactionContext.Provider
      value={{
        pendingTx,
        isTxDisabled,
        alchemy,
        setPendingTx,
        setIsTxDisabled,
        setUpdateData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionProvider;
