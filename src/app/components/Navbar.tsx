"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function Navbar() {
  return (
    <div>
      <ConnectButton />
    </div>
  );
}
