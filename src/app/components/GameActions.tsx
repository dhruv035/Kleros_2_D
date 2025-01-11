import { useState } from "react";
import RadioGroup from "./RadioGroup";
import LoadingSpinner from "./LoadingSpinner";
import { GameState } from "../hooks/useRPSState";

type GameActionsProps = {
  gameState: GameState;
  isTxDisabled: boolean;
  isFetching: boolean;
  contractData?: {
    stake?: bigint;
  };
  onPlay: (radio: number) => Promise<void>;
  onReveal: () => Promise<void>;
  onTimeout: (hasC2: boolean) => Promise<void>;
};

export default function GameActions({
  gameState,
  isTxDisabled,
  isFetching,
  contractData,
  onPlay,
  onReveal,
  onTimeout,
}: GameActionsProps) {
  const [radio, setRadio] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlay = async () => {
    if (contractData?.stake && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onPlay(radio);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleReveal = async () => {
    if (!isSubmitting) {
      setIsSubmitting(true);
      try {
        await onReveal();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleTimeout = async () => {
    if (!isSubmitting) {
      setIsSubmitting(true);
      try {
        await onTimeout(!!gameState.c2);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isButtonDisabled = isTxDisabled || isFetching || isSubmitting;

  return (
    <div>
      {!gameState.timeout && (
        <>
          {(!gameState.isCreator && !gameState.c2) ||
          (gameState.isCreator && !gameState.c1) ? (
            <>
              <RadioGroup radio={radio} setRadio={setRadio} />
              <button
                onClick={handlePlay}
                disabled={isButtonDisabled}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400 flex items-center justify-center"
              >
                {isButtonDisabled && <LoadingSpinner />}
                {isTxDisabled ? "Transaction in progress..." : isSubmitting ? "Submitting..." : isFetching ? "Loading..." : "Play Move"}
              </button>
            </>
          ) : gameState.isCreator && gameState.c2 ? (
            <button
              onClick={handleReveal}
              disabled={isButtonDisabled}
              className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 disabled:bg-gray-400 flex items-center justify-center"
            >
              {isButtonDisabled && <LoadingSpinner />}
              {isTxDisabled ? "Transaction in progress..." : isSubmitting ? "Submitting..." : isFetching ? "Loading..." : "Reveal Move"}
            </button>
          ) : null}
        </>
      )}

      {gameState.timeout && (
        <button
          onClick={handleTimeout}
          disabled={isButtonDisabled}
          className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:bg-gray-400 flex items-center justify-center"
        >
          {isButtonDisabled && <LoadingSpinner />}
          {isTxDisabled ? "Transaction in progress..." : isSubmitting ? "Submitting..." : isFetching ? "Loading..." : "Claim Timeout"}
        </button>
      )}
    </div>
  );
} 