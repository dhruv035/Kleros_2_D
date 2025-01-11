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
import { PublicClient, decodeFunctionData } from "viem";
import { fetchContractInternalTx, fetchContractTx } from "../actions/front-end/contract";
import contractABI from "../lib/abi/contractabi.json";
import { TransactionContext, TransactionContextType } from "./TransactionContext";

export type GameState = {   
  c1: string;
  c2: string;
  isFetching: boolean;
  isEnded: boolean;
  winner: string;
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
  inspectContract: (deploymentAddress: `0x${string}`) => Promise<void>;
  contractData: {
    j1: `0x${string}` | undefined;
    j2: `0x${string}` | undefined;
    lastAction: bigint | undefined;
    c2: bigint | undefined;
    stake: bigint | undefined;
  } | undefined;
  isFetching: boolean;
};

export const GameContext = createContext<GameContextType | null>(null);

const GameProvider = ({ children, address }: { children: ReactNode; address: string }) => {
  const [gameState, setGameState] = useState<GameState>({
    c1: "",
    c2: "",
    isEnded: false,
    winner: "",
    timeout: false,
    isCreator: false,
    isFetching: true,
  } as GameState);

  const { address: walletAddress, publicClient } = useContext(WalletContext) as WalletContextType;
  const { setPendingTx } = useContext(TransactionContext) as TransactionContextType;
  const [timeLeft, setTimeLeft] = useState(-1);
  const [radio, setRadio] = useState<number>(0);
  const [isInspecting, setIsInspecting] = useState(false);

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

  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      isFetching: isRPSFetching || isInspecting
    }));
  }, [isRPSFetching, isInspecting]);

  useEffect(() => {
    if (!isRPSFetching && contractData && Number(contractData.stake) === 0) {
      setIsInspecting(true);
      inspectContract(address as `0x${string}`).finally(() => {
        setIsInspecting(false);
      });
    }
  }, [address, contractData?.stake, isRPSFetching]);

  useEffect(() => {
    if (!contractData || !contractData.lastAction) return;
    if (Number(contractData.stake) !== 0) {
      const currentTime = Math.floor(Date.now() / 1000);
      const lastActionTime = Number(contractData.lastAction);
      const timeRemaining = lastActionTime + 300 - currentTime;
      
      setTimeLeft(timeRemaining);
      
      // Update timeout state based on lastAction
      setGameState(prevState => ({
        ...prevState,
        timeout: timeRemaining <= 0
      }));
    }
  }, [contractData?.lastAction]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((_timeLeft) => {
          const newTimeLeft = _timeLeft - 1;
          // Update timeout state when timer hits 0
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
    return () => {
      clearInterval(interval);
    };
  }, [timeLeft]);

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
        winner: "",
        timeout: false,
        isCreator: false,
        isFetching: false,
      });
      return;
    }

    if (addressFormatted === j1Formatted) {
      // For player 1, always check localStorage for their move
      const savedMove = localStorage.getItem(moveKey);
      console.log('Checking for move with key:', moveKey);
      console.log('Found move:', savedMove);

      // Also check all localStorage keys for debugging
      console.log('All localStorage keys:', Object.keys(localStorage).filter(k => k.includes(':move:')));

      setGameState((prevState) => {
        return {
          ...prevState,
          isCreator: true,
          c1: savedMove || "",
          c2: contractData.c2 ? Number(contractData.c2).toString() : "",
        };
      });
    } else if (addressFormatted === j2Formatted) {
      setGameState((prevState) => {
        return {
          ...prevState,
          isCreator: false,
          c2: contractData.c2 ? Number(contractData.c2).toString() : "",
        };
      });
    }
  }, [walletAddress, contractData?.c2, contractData?.j1, contractData?.j2, moveKey]);

  const inspectContract = async (deploymentAddress: `0x${string}`) => {
    try {
      const txInternal = await fetchContractInternalTx(deploymentAddress);
      if (txInternal.length) {
        if (txInternal.length === 2) {
          setGameState((prevState) => {
            return { ...prevState, winner: "tie", timeout: false, isEnded: true };
          });
        } else {
          const tx = await fetchContractTx(
            deploymentAddress,
            publicClient as PublicClient
          );
          if (tx?.length === 2) {
            const { functionName, args } = decodeFunctionData({
              abi: contractABI.abi,
              data: tx[1]?.input,
            });
            if (functionName === "solve" && args && args[0]?.toString()) {
              setGameState((prevState) => {
                return {
                  ...prevState,
                  c1: args[0]?.toString() ?? "",
                  winner: txInternal[0].to as string,
                  timeout: false,
                  isEnded: true,
                };
              });
            }
          } else {
            setGameState((prevState) => {
              return { 
                ...prevState, 
                winner: txInternal[0].to as string, 
                timeout: false,
                isEnded: true,
              };
            });
          }
        }
      } else {
        setGameState((prevState) => {
          return { ...prevState, isEnded: false };
        });
      }
    } catch (error) {
      console.error('Error inspecting contract:', error);
    }
  };

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
        inspectContract,
        contractData: contractData as {
          j1: `0x${string}` | undefined;
          j2: `0x${string}` | undefined;
          lastAction: bigint | undefined;
          c2: bigint | undefined;
          stake: bigint | undefined;
        } | undefined,
        isFetching: isRPSFetching || isInspecting,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export default GameProvider;

