import { TimerProps } from "../lib/types";

export default function Timer({ timeLeft, isEnded, timeout }: TimerProps) {
  if (timeLeft <= 0 || isEnded) return null;

  return (
    <div>
      <p className="text-sm text-gray-500 mt-1">
        Time remaining: {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </p>
      {timeout && !isEnded && (
        <p className="text-red-500 mt-1">
          Game has timed out! Click the button below to claim your stake.
        </p>
      )}
    </div>
  );
} 