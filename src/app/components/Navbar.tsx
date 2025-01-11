"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { TransactionContext, TransactionContextType } from "../context/TransactionContext";

export default function Navbar() {
  const router = useRouter();
  const {isTxDisabled} = useContext(TransactionContext) as TransactionContextType
  return (
    <div className="flex flex-col">
    <div className="flex flex-row py-4 bg-blue-300 items-space-between">
      <button className="bg-yellow-400 ml-2 p-2 rounded-[10px]"
        onClick={() => {
          router.push("/");
        }}
      >
        Home
      </button>
      <div className="flex flex-row-reverse w-full">
      <ConnectButton  /></div>
    </div>
    {isTxDisabled && <div className="w-full h-8 bg-red-400 text-center">You have a pending transaction</div>}
    </div>
  );
}
