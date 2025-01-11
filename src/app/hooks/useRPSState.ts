import { useBlockNumber, useReadContracts } from "wagmi";
import contractABI from "../lib/abi/contractabi.json";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export type GameState = {   
  c1: string;
  c2: string;
  isEnded: boolean;
  timeout: boolean;
  isCreator: boolean;
};

export const useRPSState = (
  contractAddress: `0x${string}`,
  walletAddress?: `0x${string}`
) => {
  const [gameState, setGameState] = useState<GameState>({
    c1: "",
    c2: "",
    isEnded: false,
    timeout: false,
    isCreator: false,
  });
  const [timeLeft, setTimeLeft] = useState(-1);

  const { data: blockNumber } = useBlockNumber({ 
    watch: true, 
    query: { refetchInterval: 1_000 } 
  });

  const queryClient = useQueryClient();

  const { data: contractData, isFetching, queryKey } = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        abi: contractABI.abi,
        functionName: "j1",
      },
      {
        address: contractAddress,
        abi: contractABI.abi,
        functionName: "j2",
      },
      {
        address: contractAddress,
        abi: contractABI.abi,
        functionName: "lastAction",
      },
      {
        address: contractAddress,
        abi: contractABI.abi,
        functionName: "c2",
      },
      {
        address: contractAddress,
        abi: contractABI.abi,
        functionName: "stake",
      },
    ],
    query: {
      select: (data) => {
        const isGameClosed = Number(data[4].result) === 0;
        return {
          j1: data[0].result as `0x${string}`,
          j2: data[1].result as `0x${string}`,
          lastAction: data[2].result as bigint,
          c2: data[3].result as bigint,
          stake: data[4].result as bigint,
          isGameClosed,
        };
      },
    },
  });

  // Only invalidate queries if the game is not ended
  useEffect(() => {
    if (contractData && !contractData.isGameClosed) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [blockNumber, contractData?.isGameClosed]);

  // Update game state based on contract data
  useEffect(() => {
    if (!walletAddress || !contractData) return;

    const addressFormatted = walletAddress.toLowerCase();
    const j1Formatted = contractData.j1?.toString().toLowerCase();
    const j2Formatted = contractData.j2?.toString().toLowerCase();

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

    const moveKey = `${contractAddress.toLowerCase()}:${walletAddress.toLowerCase()}:move:`;

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
  }, [walletAddress, contractData, contractAddress]);

  // Update timeout state based on lastAction
  useEffect(() => {
    if (!contractData || !contractData.lastAction || contractData.isGameClosed) {
      setTimeLeft(-1);
      return;
    }
    
    // Update timer immediately
    const updateTimer = () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const lastActionTime = Number(contractData.lastAction);
      const timeRemaining = lastActionTime + 300 - currentTime;
      
      setTimeLeft(timeRemaining);
      setGameState(prevState => ({
        ...prevState,
        timeout: timeRemaining <= 0
      }));
    };

    // Initial update
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [contractData?.lastAction, contractData?.isGameClosed, blockNumber]);

  // Remove the old timer effect since we've integrated it above
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

  return {
    gameState,
    timeLeft,
    contractData,
    isFetching,
  };
}; 