import { GameState, GameStatusProps } from "../lib/types";
import Timer from "./Timer";

export default function GameStatus({
  gameState,
  timeLeft,
  isInspecting,
  inspectionResult,
  walletAddress,
}: GameStatusProps) {
  const getGameStateMessage = () => {
    if (gameState.isEnded) {
      if (isInspecting) return "Checking game results...";
      if (inspectionResult.winner === "tie") return "Game ended in a tie!";
      if (inspectionResult.isTimeout) {
        if (inspectionResult.winner?.toLowerCase() === walletAddress?.toLowerCase()) return "You won by timeout!";
        return "You lost by timeout!";
      }
      if (inspectionResult.winner?.toLowerCase() === walletAddress?.toLowerCase()) return "You won!";
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

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Game Status</h2>
      <p className="text-gray-700">{getGameStateMessage()}</p>
      <Timer 
        timeLeft={timeLeft} 
        isEnded={gameState.isEnded} 
        timeout={gameState.timeout} 
      />
    </div>
  );
} 