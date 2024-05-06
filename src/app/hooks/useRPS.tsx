import { useBlockNumber, useReadContracts, useWriteContract } from "wagmi";
import contractABI from "../lib/abi/contractabi.json";
import { useContext, useEffect } from "react";
import { WalletContext, WalletContextType } from "../context/WalletContext";
import { useQueryClient } from "@tanstack/react-query";

//All read and write operations on the contract as hooks;
const useRPSHooks = (contractAddress: `0x${string}`) => {
  //Our contract info
  const RPSContract = {
    address: contractAddress,
    abi: contractABI.abi,
  };

  //Write functions
  const { writeContractAsync } = useWriteContract();
  const { publicClient } = useContext(WalletContext) as WalletContextType;
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const queryClient = useQueryClient();
  //

  const j1Timeout = async () => {
    let txHash;
    try {
      const hash = await writeContractAsync({
        ...RPSContract,
        functionName: "j1Timeout",
      });
      txHash = hash;
    } catch (error) {
      return;
    }
    return txHash;
  };

  const j2Timeout = async () => {
    let txHash;
    try {
      const hash = await writeContractAsync({
        ...RPSContract,
        functionName: "j2Timeout",
      });
      txHash = hash;
    } catch (error) {
      return;
    }
    return txHash;
  };

  const reveal = async (move: number, salt: bigint) => {
    let txHash;
    try {
      const hash = await writeContractAsync({
        ...RPSContract,
        functionName: "solve",
        args: [move, salt],
      });
      txHash = hash;
    } catch (error) {
      return;
    }
    return txHash;
  };

  const play = async (radio: number, stake: bigint) => {
    let txHash;
    try {
      const hash = await writeContractAsync({
        ...RPSContract,
        functionName: "play",
        args: [radio],
        value: stake,
      });
      txHash = hash;
    } catch (error) {
      return;
    }

    return txHash;
  };

  // A generic timeout function since anyone can the timeout function
  const handleTimeout = async (isCreator: boolean) => {
    let txHash;
    if (isCreator) {
      try {
        const hash = await writeContractAsync({
          ...RPSContract,
          functionName: "j1Timeout",
        });
        txHash = hash;
      } catch (error) {
        return;
      }
    } else {
      try {
        const hash = await writeContractAsync({
          ...RPSContract,
          functionName: "j2Timeout",
        });
        txHash = hash;
      } catch (error) {
        return;
      }
    }
  };

  const { data, queryKey } = useReadContracts({
    contracts: [
      {
        ...RPSContract,
        functionName: "j1",
      },
      {
        ...RPSContract,
        functionName: "j2",
      },
      {
        ...RPSContract,
        functionName: "lastAction",
      },
      {
        ...RPSContract,
        functionName: "c2",
      },
      {
        ...RPSContract,
        functionName: "stake",
      },
    ],
    query: {
      refetchInterval:1000,
      select: (data) => {
        return {
          j1: data[0].result,
          j2: data[1].result,
          lastAction: data[2].result,
          c2: data[3].result,
          stake: data[4].result,
        };
      },
    },
  });

  

  console.log("AA", data);

  return { data, j1Timeout, j2Timeout, play, reveal };
};

export { useRPSHooks };
