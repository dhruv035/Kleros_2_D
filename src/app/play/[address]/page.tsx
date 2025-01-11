"use client";

import { moves } from "@/app/lib/const";
import RadioGroup from "@/app/components/RadioGroup";
import { WalletContext, WalletContextType } from "@/app/context/WalletContext";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GameContext, GameContextType } from "@/app/context/GameContext";
import { TransactionContext, TransactionContextType } from "@/app/context/TransactionContext";

export default function Play({ params }: { params: { address: string } }) {
  const { isConnected } = useContext(WalletContext) as WalletContextType;
  const { isTxDisabled } = useContext(TransactionContext) as TransactionContextType;
  const {
    gameState,
    timeLeft,
    radio,
    setRadio,
    handlePlay,
    handleReveal,
    handleTimeout,
    contractData,
    isFetching,
  } = useContext(GameContext) as GameContextType;

  const router = useRouter();

  useEffect(() => {
    if (!isConnected) router.push("/");
  }, [isConnected]);

  // Determine if game is in an active state
  const isGameActive = !gameState.isEnded && !gameState.winner;

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get game state message
  const getGameStateMessage = () => {
    if (isFetching) return "Loading game state...";
    if (gameState.winner) {
      return gameState.winner === "tie"
        ? "Game ended in a tie!"
        : `Winner: ${formatAddress(gameState.winner)}`;
    }
    if (gameState.isEnded) return "Game has ended";
    if (!contractData?.j2) return "Waiting for Player 2 to join...";
    if (gameState.isCreator) {
      if (!gameState.c2) return "Waiting for Player 2 to play...";
      if (gameState.c1 && gameState.c2) return "Your turn to reveal!";
      return "Player 2 has played. Your turn to play!";
    } else {
      if (gameState.c2) return "Waiting for Player 1 to reveal...";
      return "Your turn to play!";
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-4">
        <div className="w-full flex justify-start mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-blue-500 hover:text-blue-700"
          >
            <u>{"<"} Go Back</u>
          </button>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="text-2xl font-semibold">Loading game state...</div>
          <div className="animate-pulse bg-gray-200 rounded-lg w-full max-w-md h-48"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-4">
      <div className="w-full flex justify-start mb-6">
        <button
          onClick={() => router.push("/")}
          className="text-blue-500 hover:text-blue-700"
        >
          <u>{"<"} Go Back</u>
        </button>
      </div>

      <div className="w-full flex flex-col items-center gap-6">
        {/* Game Status */}
        <div className="text-2xl font-semibold text-center">
          {getGameStateMessage()}
        </div>

        {/* Game Info */}
        <div className="w-full max-w-md bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-600">Game Contract:</div>
            <div className="font-medium">{formatAddress(params.address)}</div>
            
            <div className="text-gray-600">Player 1:</div>
            <div className="font-medium">
              {contractData?.j1 ? formatAddress(contractData.j1.toString()) : "..."}
              {gameState.isCreator && " (You)"}
            </div>
            
            <div className="text-gray-600">Player 2:</div>
            <div className="font-medium">
              {contractData?.j2 ? formatAddress(contractData.j2.toString()) : "..."}
              {!gameState.isCreator && " (You)"}
            </div>

            <div className="text-gray-600">Stake:</div>
            <div className="font-medium">
              {contractData?.stake ? 
                `${BigInt(contractData.stake.toString().padStart(19, '0').slice(0, -18)).toString()}.${contractData.stake.toString().padStart(19, '0').slice(-18).replace(/0+$/, '')} ETH` 
                : "..."
              }
            </div>

            {gameState.c2 && (
              <>
                <div className="text-gray-600">Player 2 Move:</div>
                <div className="font-medium">{moves[Number(gameState.c2) - 1]}</div>
              </>
            )}

            {/* Show player 1's move if they are the creator and have played */}
            {gameState.isCreator && gameState.c1 && !gameState.winner && (
              <>
                <div className="text-gray-600">Your Move:</div>
                <div className="font-medium">{moves[Number(gameState.c1) - 1]}</div>
              </>
            )}

            {gameState.c1 && gameState.winner && (
              <>
                <div className="text-gray-600">Player 1 Move:</div>
                <div className="font-medium">{moves[Number(gameState.c1) - 1]}</div>
              </>
            )}
          </div>
        </div>

        {/* Timer - Only show if game is active */}
        {isGameActive && timeLeft > 0 && (
          <div className="text-lg">
            Time remaining: <span className="font-medium">{timeLeft}s</span>
          </div>
        )}

        {/* Timeout Warning - Only show if game is active */}
        {isGameActive && gameState.timeout && (
          <div className="text-red-500 font-medium">Game has timed out!</div>
        )}

        {/* Game Actions - Only show if game is active and not fetching */}
        {isGameActive && !isFetching && (
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            {/* Show options when it's player's turn to play */}
            {(gameState.isCreator && !gameState.c1 && gameState.c2) || 
             (!gameState.isCreator && !gameState.c2) ? (
              <>
                <div className="text-lg font-medium text-center">
                  Choose your move:
                </div>
                <RadioGroup radio={radio} setRadio={setRadio} />
              </>
            ) : null}

            <div className="flex flex-col items-center gap-4 w-full">
              {gameState.isCreator ? (
                gameState.c2 ? (
                  !gameState.c1 ? (
                    <button
                      onClick={() => handlePlay()}
                      disabled={isTxDisabled}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors w-full max-w-[200px]"
                    >
                      {isTxDisabled ? "Processing..." : "Play Move"}
                    </button>
                  ) : (
                    <button
                      onClick={handleReveal}
                      disabled={isTxDisabled}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors w-full max-w-[200px]"
                    >
                      {isTxDisabled ? "Processing..." : "Reveal Move"}
                    </button>
                  )
                ) : (
                  <div className="text-gray-600 font-medium text-center">
                    Waiting for Player 2 to play...
                  </div>
                )
              ) : !gameState.c2 ? (
                <button
                  onClick={() => handlePlay()}
                  disabled={isTxDisabled}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors w-full max-w-[200px]"
                >
                  {isTxDisabled ? "Processing..." : "Play Move"}
                </button>
              ) : (
                <div className="text-gray-600 font-medium text-center">
                  Waiting for Player 1 to reveal...
                </div>
              )}

              {gameState.timeout && (
                <button
                  onClick={handleTimeout}
                  disabled={isTxDisabled}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors w-full max-w-[200px] mt-4"
                >
                  {isTxDisabled ? "Processing..." : "Claim Timeout"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
