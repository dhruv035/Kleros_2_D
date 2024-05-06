"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function Navbar() {
  const router = useRouter();
  return (
    <div className="flex flex-row items-space-between">
      <button
        onClick={() => {
          router.push("/");
        }}
      >
        Home
      </button>
      <ConnectButton />
    </div>
  );
}
