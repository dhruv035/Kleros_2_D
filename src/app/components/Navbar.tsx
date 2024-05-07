"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function Navbar() {
  const router = useRouter();
  return (
    <div className="flex flex-row my-4 items-space-between">
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
  );
}
