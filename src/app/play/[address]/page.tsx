"use client";

import { useContext, useState, useEffect } from "react";
import { WalletContext, WalletContextType } from "../../context/WalletContext";
import { TransactionContext, TransactionContextType } from "../../context/TransactionContext";
import { useRouter } from "next/navigation";
import { moves } from "../../lib/const";
import RadioGroup from "../../components/RadioGroup";
import { useInspection } from "../../hooks/useInspection";
import { useRPSState } from "../../hooks/useRPSState";
import { useRPSWrite } from "../../hooks/useRPSWrite";

export default function Play({ params: { address } }: { params: { address: string } }) {
  const { address: walletAddress, isConnected } = useContext(WalletContext) as WalletContextType;
  const { pendingTx, setPendingTx } = useContext(TransactionContext) as TransactionContextType;
  const [radio, setRadio] = useState(0);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Only check connection after component is mounted
  if (mounted && !isConnected) {
    router.push("/");
    return null;
  }

  // Don't render anything until after mounting to prevent hydration errors
  if (!mounted) {
    return null;
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getGameStateMessage = () => {
    if (gameState.isEnded) {
      if (isInspecting) return "Checking game results...";
      if (inspectionResult.winner === "tie") return "Game ended in a tie!";
      if (inspectionResult.isTimeout) {
        if (inspectionResult.winner.toLowerCase() === walletAddress?.toLowerCase()) return "You won by timeout!";
        return "You lost by timeout!";
      }
      if (inspectionResult.winner.toLowerCase() === walletAddress?.toLowerCase()) return "You won!";
      if (inspectionResult.winner) return "You lost!";
      return "Game ended";
    }
    if (gameState.timeout) return "Game has timed out!";
    if (gameState.isCreator) {
      if (!gameState.c2) return "Waiting for Player 2 to play...";
      if (gameState.c1 && gameState.c2) return "Your turn to reveal!";
      return "Player 2 has played. Your turn to play!";
    } else {
      if (gameState.c2) return "Waiting for Player 1 to reveal...";
      return "Your turn to play!";
    }
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const isTxDisabled = !!pendingTx;

  const onPlay = async () => {
    if (contractData?.stake) {
      await handlePlay(radio, contractData.stake);
    }
  };

  const onReveal = async () => {
    await handleReveal();
  };

  const onTimeout = async () => {
    await handleTimeout(!!gameState.c2);
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
          <h1 className="text-2xl font-bold mb-6">Rock Paper Scissors Game</h1>

          {/* Game Info Section */}
          <div className="mb-6 space-y-2">
            <div className="text-gray-600">Game Contract:</div>
            <div className="font-medium">{formatAddress(address)}</div>

            <div className="text-gray-600">Player 1 (Creator):</div>
            <div className="font-medium">
              {contractData?.j1 ? formatAddress(contractData.j1) : "..."}
              {contractData?.j1 && walletAddress && 
                contractData.j1.toLowerCase() === walletAddress.toLowerCase() && " (You)"}
            </div>

            <div className="text-gray-600">Player 2:</div>
            <div className="font-medium">
              {contractData?.j2 ? formatAddress(contractData.j2) : "..."}
              {contractData?.j2 && walletAddress && 
                contractData.j2.toLowerCase() === walletAddress.toLowerCase() && " (You)"}
              </div>

            <div className="text-gray-600">Stake:</div>
            <div className="font-medium">
              {contractData?.stake ? 
                `${contractData.stake.toString().padStart(19, '0').slice(0, -18)}.${contractData.stake.toString().padStart(19, '0').slice(-18).replace(/0+$/, '')} ETH` 
                : "..."
              }
            </div>

            {/* Show player 1's move if they are the creator and have played */}
            {gameState.isCreator && gameState.c1 && (
              <>
                <div className="text-gray-600">Your Move:</div>
                <div className="font-medium">{moves[Number(gameState.c1) - 1]}</div>
              </>
            )}

            {!gameState.isCreator && gameState.isEnded && inspectionResult.moveRevealed && inspectionResult.c1 && (
              <>
                <div className="text-gray-600">Player 1&#39;s Move:</div>
                <div className="font-medium">{moves[Number(inspectionResult.c1) - 1]}</div>
              </>
            )}

            {gameState.c2 && (
              <>
                <div className="text-gray-600">Player 2&#39;s Move:</div>
                <div className="font-medium">{moves[Number(gameState.c2) - 1]}</div>
              </>
            )}
          </div>

          {/* Game Status */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Game Status</h2>
            <p className="text-gray-700">{getGameStateMessage()}</p>
            {timeLeft > 0 && !gameState.isEnded && (
              <p className="text-sm text-gray-500 mt-1">
                Time remaining: {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, "0")}
              </p>
            )}
            {gameState.timeout && !gameState.isEnded && (
              <p className="text-red-500 mt-1">
                Game has timed out! Click the button below to claim your stake.
              </p>
            )}
            </div>

          {/* Game Actions */}
          {!gameState.isEnded && (
            <div className="space-y-4">
              {!gameState.timeout && (
                <>
                  {(!gameState.isCreator && !gameState.c2) ||
                  (gameState.isCreator && !gameState.c1) ? (
                    <>
                      <RadioGroup radio={radio} setRadio={setRadio} />
                      <button
                        onClick={onPlay}
                        disabled={isTxDisabled || isFetching}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400 flex items-center justify-center"
                      >
                        {(isTxDisabled || isFetching) && <LoadingSpinner />}
                        {isTxDisabled ? "Transaction in progress..." : isFetching ? "Loading..." : "Play Move"}
                      </button>
                    </>
                  ) : gameState.isCreator && gameState.c2 ? (
                    <button
                      onClick={onReveal}
                      disabled={isTxDisabled || isFetching}
                      className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 disabled:bg-gray-400 flex items-center justify-center"
                    >
                      {(isTxDisabled || isFetching) && <LoadingSpinner />}
                      {isTxDisabled ? "Transaction in progress..." : isFetching ? "Loading..." : "Reveal Move"}
                    </button>
                  ) : null}
                </>
              )}

              {gameState.timeout && (
                <button
                  onClick={onTimeout}
                  disabled={isTxDisabled || isFetching}
                  className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:bg-gray-400 flex items-center justify-center"
                >
                  {(isTxDisabled || isFetching) && <LoadingSpinner />}
                  {isTxDisabled ? "Transaction in progress..." : isFetching ? "Loading..." : "Claim Timeout"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
