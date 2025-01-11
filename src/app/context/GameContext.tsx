"use client";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { WalletContext, WalletContextType } from "./WalletContext";
import { useRPSHooks } from "../hooks/useRPS";
import { TransactionContext, TransactionContextType } from "./TransactionContext";

export type GameState = {   
  c1: string;
  c2: string;
  isEnded: boolean;
  timeout: boolean;
  isCreator: boolean;
};

export type GameContextType = {
  gameState: GameState;
  timeLeft: number;
  radio: number;
  setRadio: Dispatch<SetStateAction<number>>;
  handlePlay: () => Promise<void>;
  handleReveal: () => Promise<void>;
  handleTimeout: () => Promise<void>;
  contractData: {
    j1: `0x${string}` | undefined;
    j2: `0x${string}` | undefined;
    lastAction: bigint | undefined;
    c2: bigint | undefined;
    stake: bigint | undefined;
    isGameClosed: boolean;
  } | undefined;
  isFetching: boolean;
};

export const GameContext = createContext<GameContextType | null>(null);

const GameProvider = ({ children, address }: { children: ReactNode; address: string }) => {
  const [gameState, setGameState] = useState<GameState>({
    c1: "",
    c2: "",
    isEnded: false,
    timeout: false,
    isCreator: false,
  } as GameState);

  const { address: walletAddress, publicClient } = useContext(WalletContext) as WalletContextType;
  const { setPendingTx } = useContext(TransactionContext) as TransactionContextType;
  const [timeLeft, setTimeLeft] = useState(-1);
  const [radio, setRadio] = useState<number>(0);

  const {
    data: contractData,
    isFetching: isRPSFetching,
    j1Timeout,
    j2Timeout,
    play,
    reveal,
  } = useRPSHooks(address as `0x${string}`);

  const moveKey = walletAddress ? `${address.toLowerCase()}:${walletAddress.toLowerCase()}:move:` : "";
  const saltHexKey = walletAddress ? `${address.toLowerCase()}:${walletAddress.toLowerCase()}:salt:` : "";

  // Update game state based on contract data
  useEffect(() => {
    if (!walletAddress || !contractData) return;

    const addressFormatted = walletAddress.toLocaleLowerCase();
    const j1Formatted = contractData.j1?.toString().toLocaleLowerCase();
    const j2Formatted = contractData.j2?.toString().toLocaleLowerCase();

    // Reset game state if wallet address is not part of the game
    if (addressFormatted !== j1Formatted && addressFormatted !== j2Formatted) {
      setGameState({
        c1: "",
        c2: "",
        isEnded: false,
        timeout: false,
        isCreator: false,
      });
      return;
    }

    setGameState(prevState => ({
      ...prevState,
      isEnded: contractData.isGameClosed,
      isCreator: addressFormatted === j1Formatted,
      c2: contractData.c2 ? Number(contractData.c2).toString() : "",
      // For player 1, always check localStorage for their move
      ...(addressFormatted === j1Formatted && {
        c1: localStorage.getItem(moveKey) || "",
      }),
    }));
  }, [walletAddress, contractData, moveKey]);

  // Update timeout state based on lastAction
  useEffect(() => {
    if (!contractData || !contractData.lastAction || contractData.isGameClosed) return;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const lastActionTime = Number(contractData.lastAction);
    const timeRemaining = lastActionTime + 300 - currentTime;
    
    setTimeLeft(timeRemaining);
    setGameState(prevState => ({
      ...prevState,
      timeout: timeRemaining <= 0
    }));
  }, [contractData?.lastAction, contractData?.isGameClosed]);

  // Update timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((_timeLeft) => {
          const newTimeLeft = _timeLeft - 1;
          if (newTimeLeft <= 0) {
            setGameState(prevState => ({
              ...prevState,
              timeout: true
            }));
          }
          return newTimeLeft;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handlePlay = async () => {
    if (radio === 0) {
      alert("No option Selected");
      return;
    }
    if (!contractData || typeof contractData.stake !== "bigint") {
      return;
    }
    localStorage.setItem(moveKey, radio?.toString());
    const txHash = await play(radio, contractData.stake);
    if (txHash) {
      setPendingTx(txHash);
      localStorage.setItem("pendingTx", txHash as string);
    }
  };

  const handleReveal = async () => {
    const move = localStorage.getItem(moveKey);
    const saltString = localStorage.getItem(saltHexKey);
    if (!move || !saltString) return;
    const salt = BigInt(saltString);
    const txHash = await reveal(parseInt(move), salt);
    if (txHash) {
      setPendingTx(txHash);
      localStorage.setItem("pendingTx", txHash as string);
    }
  };

  const handleTimeout = async () => {
    let txHash;
    if (contractData?.c2) {
      txHash = await j1Timeout();
    } else {
      txHash = await j2Timeout();
    }
    if (txHash) {
      setPendingTx(txHash);
      localStorage.setItem("pendingTx", txHash as string);
    }
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        timeLeft,
        radio,
        setRadio,
        handlePlay,
        handleReveal,
        handleTimeout,
        contractData: contractData as {
          j1: `0x${string}` | undefined;
          j2: `0x${string}` | undefined;
          lastAction: bigint | undefined;
          c2: bigint | undefined;
          stake: bigint | undefined;
          isGameClosed: boolean;
        } | undefined,
        isFetching: isRPSFetching,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export default GameProvider;

