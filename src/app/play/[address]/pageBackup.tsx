"use client";

import { RPS } from "@/app/lib/abi";
import RadioGroup from "@/app/components/RadioGroup";
import {
  TransactionContext,
  TransactionContextType,
} from "@/app/context/TransactionContext";
import { WalletContext, WalletContextType } from "@/app/context/WalletContext";
import { useRPSHooks } from "@/app/hooks/useRPS";
import { useContext, useEffect, useState } from "react";
import { decodeFunctionData, formatEther, parseEther } from "viem";
import { fetchContractTx } from "@/app/services/front-end/contract";

type GameState = {
  userMove: string;
  c1: string;
  winner: string;
  diff: number;
  timeout: boolean;
  isCreator: boolean; //Who timed Out
};

export default function Create({ params }: { params: { address: string } }) {



  const { data: contractData, writeContractAsync } = useRPSHooks(
    params.address as `0x${string}`
  );


  
  const { address } = useContext(WalletContext) as WalletContextType;
  const { isTxDisabled, setIsTxDisabled, setPendingTx, alchemy } = useContext(
    TransactionContext
  ) as TransactionContextType;

  const [gameState, setGameState] = useState<GameState>({
    userMove: "",
    winner: "",
    diff: 0,
    timeout: false,
    isCreator: false,
  } as GameState);

  const [radio, setRadio] = useState<number>(0);


  //Constants
  const moveKey =
    params?.address.toLowerCase() + ":" + address?.toLowerCase() + ":move:";
  const saltHexKey =
    params?.address.toLowerCase() + ":" + address?.toLowerCase() + ":salt:";
  

  useEffect(() => {
    let intervalId: any;

    if (!params) return;
    if (gameState.diff > 60 * 5 + 2) {
      if (Number(contractData?.c2) === 0)
        setGameState({ ...gameState, isCreator: false });
      else setGameState({ ...gameState, isCreator: true });
      setGameState({ ...gameState, timeout: true });
      return;
    } else {
      intervalId = setInterval(
        () => setGameState({ ...gameState, diff: gameState.diff + 1 }),
        1000
      );
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [gameState.diff, contractData?.c2]);

  useEffect(() => {
    const difference =
      Math.floor(Date.now() / 1000) - Number(contractData?.lastAction);
    setGameState({ ...gameState, diff: difference });
    loadMove();
  }, [contractData?.lastAction]);

  const resetGameStates = () => {
    setGameState({
      winner: "",
      diff: 0,
      userMove: "",
      timeout: false,
      isCreator: false,
      c1: "",
    });
  };

  //Constants

  useEffect(() => {
    (async () => {
      if (!params.address) {
        resetGameStates();
      } else {
        const move = localStorage.getItem(moveKey);
        console.log("3C");
        if (move?.length) setGameState({ ...gameState, userMove: move });
        
      }
    })();
  }, [params.address]);

  useEffect(()=>{
    (async()=>{
      console.log("HEEYER")
      await inspectContract(params.address as `0x${string}`);

    })();
  },[])

  const loadMove = () => {
    if (params) {
      const move = localStorage.getItem(moveKey);
      if (move?.length) setGameState({ ...gameState, userMove: move });
    }
  };

  const inspectContract = async (deployementAddress: `0x${string}`) => {
    // console.log("EXEC", deployementAddress);
    // const { dx2, data } = await fetchContractTx(deployementAddress, alchemy);
    // if (dx2.result.length > 2) {
    //   console.log("1");
    //   const { functionName, args } = decodeFunctionData({
    //     abi: RPS,
    //     data: dx2.result[2].input,
    //   });
    //   console.log("2");
    //   console.log("HEREdeceode", functionName, args);
    //   if (functionName === "solve") {
    //     setGameState({ ...gameState, c1: args[0].toString() });
    //   }
    // }
    // console.log("3");
    // if (data.transfers.length) {
    //   if (data.transfers.length === 2) {
    //     setGameState({ ...gameState, winner: "tie" });
    //   } else
    //     data.transfers[0].to &&
    //       setGameState({ ...gameState, winner: data.transfers[0].to });
    // }
  };
  const handlePlay = async () => {
    if (radio === 0) {
      alert("No option Selected");
      return;
    }
    if (!contractData || typeof contractData.stake !== "string") {
      console.log("IIOS", contractData);
      return;
    }
    localStorage.setItem(moveKey, radio.toString());
    let hash;
    try {
      const txHash = await writeContractAsync({
        address: params.address as `0x${string}`,
        abi: RPS,
        functionName: "play",
        args: [radio],
        value: parseEther(contractData.stake),
      });
      hash = txHash;
    } catch (error) {
      return;
    }

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
    let hash;
    try {
      const txHash = await writeContractAsync({
        address: params.address as `0x${string}`,
        abi: RPS,
        functionName: "solve",
        args: [parseInt(move), salt],
      });
      hash = txHash;
    } catch (error) {
      return;
    }

    setPendingTx(hash);
    localStorage.setItem("pendingTx", hash as string);
  };

  const handleTimeout = async () => {
    if (!params) return;

    let txHash;

    if (gameState.isCreator) {
      try {
        const hash = await writeContractAsync({
          address: params.address as `0x${string}`,
          abi: RPS,
          functionName: "j1Timeout",
        });
        txHash = hash;
      } catch (error) {
        console.log("HEY", error);
        return;
      }
    } else {
      try {
        const hash = await writeContractAsync({
          address: params.address as `0x${string}`,
          abi: RPS,
          functionName: "j2Timeout",
        });
        txHash = hash;
      } catch (error) {
        console.log("HEY", error);
        return;
      }
    }
    setPendingTx(txHash);
    localStorage.setItem("pendingTx", txHash as string);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <>
        <div>
          Staked amount is{" "}
          {typeof contractData?.stake === "bigint"
            ? formatEther(contractData?.stake)
            : "0"}
        </div>
        {gameState.userMove !== "0" && (
          <div>Your move: {gameState.userMove}</div>
        )}

        <div>
          Enemy move:{" "}
          {gameState.isCreator ? Number(contractData?.c2).toString() : ""}
        </div>

        {gameState.winner !== "" ? (
          gameState.winner === "tie" ? (
            <div>Its a Tie</div>
          ) : gameState.winner == address?.toLowerCase() ? (
            <div>You are the winner!</div>
          ) : contractData?.c2 && Number(contractData?.c2) === 0 ? (
            <div>You Didnt join the game and it timed out</div>
          ) : (
            <div>You lost</div>
          )
        ) : gameState.timeout ? (
          <>
            <div className="flex flex-col items-center text-[30px] text-blue-600">
              Turn has expired for the{" "}
              {!gameState.isCreator ? "Player." : "Creator."} Please call the
              timeout function
              <button
                disabled={isTxDisabled}
                className="mt-4 text-black border-2 rounded-[10px] bg-blue-700 w-[200px] disabled:bg-gray-300"
                onClick={() => {
                  handleTimeout();
                }}
              >
                Call Timeout
              </button>
            </div>
          </>
        ) : (
          <>
            <div>Time Elapsed in seconds : {gameState.diff} seconds</div>
            {
              //If user is in init stage
              <>
                {address === contractData?.j2 && (
                  <>
                    {!contractData?.c2 && (
                      <RadioGroup radio={radio} setRadio={setRadio} />
                    )}
                    <button
                      className="border-2 bg-blue-400 disabled:bg-gray-300 rounded-[10px] w-[100px]"
                      onClick={handlePlay}
                      disabled={
                        address !== contractData?.j2 ||
                        Number(contractData?.c2) !== 0 ||
                        isTxDisabled
                      }
                    >
                      Play
                    </button>
                  </>
                )}
                {address === contractData?.j1 && (
                  <button
                    onClick={handleReveal}
                    disabled={
                      address !== contractData?.j1 ||
                      Number(contractData?.c2) === 0 ||
                      isTxDisabled
                    }
                    className="border-2 bg-blue-400 disabled:bg-gray-300 rounded-[10px] w-[100px]"
                  >
                    Reveal
                  </button>
                )}
              </>
            }
          </>
        )}
      </>
    </div>
  );
}
