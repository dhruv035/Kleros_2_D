"use client";

import GameProvider from "@/app/context/GameContext";

export default function PlayLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { address: string };
}) {
  return <GameProvider address={params.address}>{children}</GameProvider>;
} 