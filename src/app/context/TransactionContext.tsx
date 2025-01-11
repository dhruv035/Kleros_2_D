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
import { useRouter } from "next/navigation";
import { usePublicClient } from "wagmi";

export type TransactionContextType = {
  isTxDisabled: boolean;
  pendingTx: `0x${string}` | undefined;
  setPendingTx: Dispatch<SetStateAction<`0x${string}` | undefined>>;
  setIsTxDisabled: Dispatch<SetStateAction<boolean>>;
  savePendingTx: (hash: `0x${string}`, nonce: number, from: `0x${string}`) => void;
};

export type Deployment = {
  address: string;
  j1: string;
  j2?: string;
};

export type PendingTxDetails = {
  hash: string;
  nonce: number;
  from: string;
};

export const TransactionContext = createContext<TransactionContextType | null>(
  null
);

const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const publicClient = usePublicClient();
  const [pendingTx, setPendingTx] = useState<`0x${string}` | undefined>();
  const [isTxDisabled, setIsTxDisabled] = useState<boolean>(false);

  const router = useRouter();

  const savePendingTx = (hash: `0x${string}`, nonce: number, from: `0x${string}`) => {
    const txDetails: PendingTxDetails = { hash, nonce, from };
    localStorage.setItem("pendingTx", JSON.stringify(txDetails));
    setPendingTx(hash);
  };

  useEffect(() => {
    if (pendingTx) {
      setIsTxDisabled(true);
      (async () => {
        if (!publicClient) return;

        try {
          // Get transaction details from chain if not stored
          const tx = await publicClient.getTransaction({ hash: pendingTx });
          if (!tx?.nonce || !tx?.from) {
            throw new Error('Could not get transaction details');
          }
          
          // Always save/update transaction details
          savePendingTx(pendingTx, Number(tx.nonce), tx.from);

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
          localStorage.removeItem("pendingTx");
        } catch (error) {
          // Check if transaction was replaced
          try {
            const tx = await publicClient.getTransaction({ hash: pendingTx });
            if (tx?.from && tx?.nonce) {
              const latestNonce = await publicClient.getTransactionCount({ 
                address: tx.from 
              });

              if (latestNonce > Number(tx.nonce)) {
                // A replacement transaction exists, find it
                const blockNumber = await publicClient.getBlockNumber();
                for (let i = Number(blockNumber); i > Number(blockNumber) - 50; i--) {
                  const block = await publicClient.getBlock({ blockNumber: BigInt(i) });
                  for (const txHash of block.transactions) {
                    const blockTx = await publicClient.getTransaction({ hash: txHash });
                    if (blockTx?.from === tx.from && Number(blockTx?.nonce) === Number(tx.nonce) && blockTx?.hash !== pendingTx) {
                      // Found the replacement transaction
                      savePendingTx(blockTx.hash, Number(tx.nonce), tx.from);
                      return;
                    }
                  }
                }
              }
            }
          } catch (searchError) {
            console.error('Error searching for replacement:', searchError);
          }
          
          // If we get here, either there was an error or no replacement was found
          console.error('Transaction error:', error);
          setIsTxDisabled(false);
          setPendingTx(undefined);
          localStorage.removeItem("pendingTx");
        }
      })();
    } else {
      const storedTx = localStorage.getItem("pendingTx");
      if (storedTx) {
        try {
          const details: PendingTxDetails = JSON.parse(storedTx);
          setPendingTx(details.hash as `0x${string}`);
        } catch (error) {
          console.error('Error parsing stored transaction:', error);
          localStorage.removeItem("pendingTx");
        }
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
        savePendingTx,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionProvider;
