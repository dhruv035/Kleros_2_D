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

import { addDeployment } from "../actions/front-end/deployments";

import { waitForTransactionReceipt } from "viem/actions";
import { WalletContext, WalletContextType } from "./WalletContext";
import { useRouter } from "next/navigation";
import { Alchemy, Network } from "alchemy-sdk";
//Global contexts may be persisted and managed here

export type TransactionContextType = {
  isTxDisabled: boolean;
  pendingTx: `0x${string}` | undefined;
  setPendingTx: Dispatch<SetStateAction<`0x${string}` | undefined>>;
  setIsTxDisabled: Dispatch<SetStateAction<boolean>>;
};

export type Deployment = {
  address: string;
  j1: string;
  j2?: string;
};
export const TransactionContext = createContext<TransactionContextType | null>(
  null
);

const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const { publicClient } = useContext(WalletContext) as WalletContextType;
  const [pendingTx, setPendingTx] = useState<`0x${string}` | undefined>();
  const [isTxDisabled, setIsTxDisabled] = useState<boolean>(false);

  const router = useRouter();
  useEffect(() => {
    if (pendingTx) {
      setIsTxDisabled(true);
      (async () => {
        if (!publicClient) return;

        const result = await waitForTransactionReceipt(publicClient, {
          hash: pendingTx as `0x${string}`,
        });

        if (result.status === "success") {
          if (result.to === null) {
            if (!result.from || !result.contractAddress) return;
            await addDeployment({
              address: result.contractAddress as string,
            }).then(() => {
              router.push(("/play/" + result.contractAddress) as string);
            });
          }
        } else if (result.status === "reverted") {
          setIsTxDisabled(false);
        }
        setIsTxDisabled(false);
        setPendingTx(undefined);
        localStorage.setItem("pendingTx", "");
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
        setPendingTx,
        setIsTxDisabled,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionProvider;
