"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { TransactionContext, TransactionContextType } from "../context/TransactionContext";

export default function Navbar() {
  const router = useRouter();
  const { isTxDisabled, pendingTx } = useContext(TransactionContext) as TransactionContextType;
  
  return (
    <div className="flex flex-col">
      <div className="flex flex-row py-4 bg-blue-300 items-space-between">
        <button 
          className="bg-yellow-400 ml-2 p-2 rounded-[10px] hover:bg-yellow-500 transition-colors"
          onClick={() => {
            router.push("/");
          }}
        >
          Home
        </button>
        <div className="flex flex-row-reverse w-full">
          <ConnectButton />
        </div>
      </div>
      {isTxDisabled && (
        <div className="w-full bg-amber-500 text-white py-2 px-4 flex items-center justify-center space-x-2 transition-all shadow-md">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Transaction in progress... {pendingTx && `(${pendingTx.slice(0, 6)}...${pendingTx.slice(-4)})`}</span>
        </div>
      )}
    </div>
  );
}
