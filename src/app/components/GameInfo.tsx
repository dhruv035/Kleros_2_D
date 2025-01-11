import { formatEther } from "viem";
import { moves } from "../lib/const";

type GameInfoProps = {
  address: string;
  j1?: string;
  j2?: string;
  stake?: bigint;
  walletAddress?: string;
  gameState: {
    isCreator: boolean;
    c1: string;
    c2: string;
    isEnded: boolean;
  };
  inspectionResult?: {
    moveRevealed?: boolean;
    c1?: string;
  };
};

export default function GameInfo({ 
  address, 
  j1, 
  j2, 
  stake, 
  walletAddress,
  gameState,
  inspectionResult
}: GameInfoProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="mb-6 space-y-2">
      <h2 className="text-xl font-semibold mb-2">Game Info</h2>
      
      <div className="text-gray-600">Game Contract:</div>
      <div className="font-medium">{formatAddress(address)}</div>

      <div className="text-gray-600">Player 1 (Creator):</div>
      <div className="font-medium">
        {j1 ? formatAddress(j1) : "..."}
        {j1 && walletAddress && 
          j1.toLowerCase() === walletAddress.toLowerCase() && " (You)"}
      </div>

      <div className="text-gray-600">Player 2:</div>
      <div className="font-medium">
        {j2 ? formatAddress(j2) : "..."}
        {j2 && walletAddress && 
          j2.toLowerCase() === walletAddress.toLowerCase() && " (You)"}
      </div>

      <div className="text-gray-600">Stake:</div>
      <div className="font-medium">
        {stake ? 
          `${formatEther(stake)} ETH`
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

      {/* Show player 1's move to player 2 after game ends and move is revealed */}
      {!gameState.isCreator && gameState.isEnded && inspectionResult?.moveRevealed && inspectionResult.c1 && (
        <>
          <div className="text-gray-600">Player 1&#39;s Move:</div>
          <div className="font-medium">{moves[Number(inspectionResult.c1) - 1]}</div>
        </>
      )}

      {/* Show player 2's move if it exists */}
      {gameState.c2 && (
        <>
          <div className="text-gray-600">Player 2&#39;s Move:</div>
          <div className="font-medium">{moves[Number(gameState.c2) - 1]}</div>
        </>
      )}
    </div>
  );
} 