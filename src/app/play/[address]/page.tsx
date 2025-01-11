"use client";

import { useContext, useState, useEffect } from "react";
import { TransactionContext, TransactionContextType } from "../../context/TransactionContext";
import { useRouter } from "next/navigation";
import { useInspection } from "../../hooks/useInspection";
import { useRPSState } from "../../hooks/useRPSState";
import { useRPSWrite } from "../../hooks/useRPSWrite";
import { useAccount, useConnect } from "wagmi";
import GameInfo from "@/app/components/GameInfo";
import GameActions from "@/app/components/GameActions";
import GameStatus from "@/app/components/GameStatus";

export default function Play({ params: { address } }: { params: { address: string } }) {
  const { address: walletAddress, isConnected, connector: activeConnector } = useAccount();
  const { connect, connectors } = useConnect();
  const { pendingTx, setPendingTx } = useContext(TransactionContext) as TransactionContextType;
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto reconnect on page load if there's an active connector
  useEffect(() => {
    if (activeConnector && !isConnected) {
      connect({ connector: activeConnector });
    }
  }, [activeConnector, isConnected, connect]);

  const { gameState, timeLeft, contractData, isFetching } = useRPSState(
    address as `0x${string}`,
    walletAddress as `0x${string}`
  );

  const { handlePlay, handleReveal, handleTimeout } = useRPSWrite(
    address as `0x${string}`,
    walletAddress as `0x${string}`,
    setPendingTx
  );

  const { isInspecting, result: inspectionResult } = useInspection(address, gameState.isEnded);

  // Don't render anything until after mounting to prevent hydration errors
  if (!mounted) {
    return null;
  }

  const isPlayer = walletAddress && contractData?.j1 && contractData?.j2 && (
    walletAddress.toLowerCase() === contractData.j1.toLowerCase() ||
    walletAddress.toLowerCase() === contractData.j2.toLowerCase()
  );

  const onPlay = async (radio: number) => {
    if (!isConnected) {
      router.push("/");
      return;
    }
    if (!isPlayer) {
      return;
    }
    if (contractData?.stake) {
      await handlePlay(radio, contractData.stake);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.push("/")}
          className="mb-4 text-blue-500 hover:text-blue-700"
        >
          ← Back to Home
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Rock Paper Scissors Lizard Spock</h1>

          <GameStatus
            gameState={gameState}
            timeLeft={timeLeft}
            isInspecting={isInspecting}
            inspectionResult={inspectionResult}
            walletAddress={walletAddress}
          />

          <GameInfo
            address={address}
            j1={contractData?.j1}
            j2={contractData?.j2}
            stake={contractData?.stake}
            walletAddress={walletAddress}
            gameState={gameState}
            inspectionResult={inspectionResult}
          />

          {!gameState.isEnded && isPlayer && (
            <GameActions
              gameState={gameState}
              isTxDisabled={!!pendingTx}
              isFetching={isFetching}
              contractData={contractData}
              onPlay={onPlay}
              onReveal={handleReveal}
              onTimeout={handleTimeout}
            />
          )}

          {!isConnected && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                Please connect your wallet to interact with this game.
              </p>
            </div>
          )}

          {isConnected && !isPlayer && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                You are not a player in this game. Only players can interact with the game.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
