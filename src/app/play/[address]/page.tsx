"use client";

import { RPS } from "@/app/lib/abi";
import RadioGroup from "@/app/components/RadioGroup";
import {
  TransactionContext,
  TransactionContextType,
} from "@/app/context/TransactionContext";
import { WalletContext, WalletContextType } from "@/app/context/WalletContext";
import { useRPSHooks } from "@/app/hooks/useRPS";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  PublicClient,
  decodeFunctionData,
  formatEther,
  parseEther,
} from "viem";
import {
  fetchContractInternalTx,
  fetchContractTx,
} from "@/app/actions/front-end/contract";
import { useRouter } from "next/navigation";
import { Alchemy, Network } from "alchemy-sdk";

type GameState = {
  userMove: string;
  c1: string;
  winner: string;
  timeout: boolean;
  isCreator: boolean;
};

export default function Play({ params }: { params: { address: string } }) {
  const {
    data: contractData,
    j1Timeout,
    j2Timeout,
    play,
    reveal,
  } = useRPSHooks(params.address as `0x${string}`);

  const router = useRouter();
  const { address, isConnected, publicClient } = useContext(
    WalletContext
  ) as WalletContextType;
  const { isTxDisabled, setIsTxDisabled, setPendingTx } = useContext(
    TransactionContext
  ) as TransactionContextType;

  const [gameState, setGameState] = useState<GameState>({
    userMove: "",
    c1: "",
    winner: "",
    timeout: false,
    isCreator: false,
  } as GameState);

  const config = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY, // Replace with your API key
    network: Network.ETH_SEPOLIA, // Replace with your network
  };

  // Creates an Alchemy object instance with the config to use for making requests
  const alchemy = new Alchemy(config);

  const [timeLeft, setTimeLeft] = useState(-1);

  const [radio, setRadio] = useState<number>(0);

  //Effects

  useEffect(() => {
    //If wallet is disconnected reroute to home page
    if (!isConnected) router.push("/");
  }, [isConnected]);

  //If contract stake changes,specifically goes to zero, inspect the contract internal transactions
  useEffect(() => {
    if (contractData && Number(contractData.stake) === 0) {
      inspectContract(params.address as `0x${string}`);
    }
  }, [params.address, contractData?.stake]);

  useEffect(() => {
    if (!contractData || !contractData.lastAction) return;
    if (Number(contractData.stake) !== 0) {
      setTimeLeft(
        Number(contractData.lastAction) + 300 - Math.floor(Date.now() / 1000)
      );
    }
  }, [contractData?.lastAction]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((_timeLeft) => _timeLeft - 1);
      }, 1000);
      if (gameState.timeout === true)
        setGameState({ ...gameState, timeout: false });
    } else if (gameState.timeout === false)
      setGameState({ ...gameState, timeout: true });
    return () => {
      clearInterval(interval);
    };
  }, [timeLeft]);
  useEffect(() => {
    if (!address || !contractData) return;

    if (address !== contractData.j1 && address !== contractData.j2) {
      //If current address is changed to one that is not part of the game auto send to home page
      router.push("/");
    } else {
      if (address === contractData.j1) {
        //Check if current address is the owner
        setGameState({
          ...gameState,
          isCreator: true,
          c1: localStorage.getItem(moveKey) as string,
        });
      } else {
        setGameState({ ...gameState, isCreator: false });
      }
    }
  }, [address, contractData?.c2]);

  //Constants to fetch move and salt from localStorage
  const moveKey =
    params?.address.toLowerCase() + ":" + address?.toLowerCase() + ":move:";
  const saltHexKey =
    params?.address.toLowerCase() + ":" + address?.toLowerCase() + ":salt:";

  const loadMove = () => {
    if (params) {
      const move = localStorage.getItem(moveKey);
      if (move?.length) setGameState({ ...gameState, userMove: move });
    }
  };

  const inspectContract = async (deploymentAddress: `0x${string}`) => {
    const txInternal = await fetchContractInternalTx(
      deploymentAddress,
      alchemy
    );
    console.log("txInternal", txInternal);
    //Check if the stake has been paid out, if it's paid out means the game has ended
    if (txInternal.length) {
      if (txInternal.length === 2) {
        //Two internal transactions mean it was tie, otherwise just check the recepient of the single internal transaction
        setGameState({ ...gameState, winner: "tie" });
      } else {
        setGameState({ ...gameState, winner: txInternal[0].to as string });

        //Check if it was solved, find the value of c1
        const tx = await fetchContractTx(
          deploymentAddress,
          alchemy,
          publicClient as PublicClient
        );
        console.log("Tx", tx);
        if (tx?.length > 2) {
          const { functionName, args } = decodeFunctionData({
            abi: RPS,
            data: tx[2]?.input, //If there is a solve transaction it will always be the 3rd one. We can just filter for a solve transaction as well but this is optimal for the given problem
          });
          if (functionName === "solve") {
            setGameState({ ...gameState, c1: args[0].toString() });
          }
        }
      }
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
    localStorage.setItem(moveKey, radio.toString());
    const hash = await play(radio, contractData.stake);
    setPendingTx(hash);
    localStorage.setItem("pendingTx", hash as string);
  };

  const handleReveal = async () => {
    if (!params) return;
    const move = localStorage.getItem(moveKey);
    const saltString = localStorage.getItem(saltHexKey);
    if (!move) return;
    if (!saltString) return;

    const salt = BigInt(saltString);
    const hash = await reveal(parseInt(move), salt);
    setPendingTx(hash);
    localStorage.setItem("pendingTx", hash as string);
  };

  const handleTimeout = async () => {
    if (!params) return;
    let txHash;
    if (contractData?.c2) {
      txHash = await j1Timeout();
    } else {
      txHash = await j2Timeout();
    }
    setPendingTx(txHash);
    localStorage.setItem("pendingTx", txHash as string);
  };

  return (
    <div>
      {contractData && (
        <div>
          <div>
            GameState
            <div>
              {Object.keys(contractData).map((key, index) => {
                let value = Object.values(contractData)[index];
                return (
                  <div key={index}>
                    {key} :{" "}
                    {typeof value === "string"
                      ? (value as string)
                      : key === "stake"
                      ? formatEther(value as bigint)
                      : Number(value)}
                  </div>
                );
              })}
            </div>
          </div>
          {gameState.winner !== "" ? (
            //Concluded State
            <div>
              {gameState.winner.toLocaleLowerCase() ===
              (address as string).toLocaleLowerCase()
                ? "You got the payout"
                : "You didn't get the payout"}
            </div>
          ) : gameState.timeout ? (
            //Timed out State
            <div>
              {contractData.c2 ? "J1 Timed Out" : "J2 Timed Out"}
              <div>
                <button
                disabled={isTxDisabled}
                  onClick={() => {
                    handleTimeout();
                  }}
                >
                  Call Timeout
                </button>
              </div>
            </div>
          ) : gameState.isCreator ? (
            //Reveal State (Creator)
            <div>
              {contractData.c2 ? (
                <button
                disabled={isTxDisabled}
                  onClick={() => {
                    handleReveal();
                  }}
                >
                  Reveal Move
                </button>
              ) : (
                <div>Wait for the opponent play</div>
              )}
            </div>
          ) : (
            //Play move State (Player 2)
            <div>
              {contractData.c2 ? (
                <div>Wait for the opponent to reveal</div>
              ) : (
                <div>
                  <RadioGroup radio={radio} setRadio={setRadio} />
                  <button
                    disabled={isTxDisabled}
                    onClick={() => {
                      handlePlay();
                    }}
                  >
                    Play
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}