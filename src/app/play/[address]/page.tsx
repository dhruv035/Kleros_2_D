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
import { fetchContractInternalTx, fetchContractTx } from "@/app/services/front-end/contract";

type GameState = {
  userMove: string;
  c1: string;
  winner: string;
  diff: number;
  timeout: boolean;
  isCreator: boolean; //Who timed Out
};

export default function Play({ params }: { params: { address: string } }) {



  const { data: contractData, writeContractAsync } = useRPSHooks(
    params.address as `0x${string}`
  );


  
  const { address } = useContext(WalletContext) as WalletContextType;
  const { isTxDisabled, setIsTxDisabled, setPendingTx } = useContext(
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


  //Effects

  useEffect(()=>{
    inspectContract(params.address as `0x${string}`)
  },[params.address,contractData])

  //Constants
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

  const inspectContract = async (deployementAddress: `0x${string}`) => {
    
    if(!contractData)
        return;

    if(Number(contractData.stake)===0){
        const time =Math.floor( Date.now()/1000);
        console.log("datas",time,Number(contractData.lastAction),contractData.stake)
       
    }
    else {

    }
    console.log("EXEC", deployementAddress);
    const dx2  = await fetchContractTx(deployementAddress);
    const dxInternalDecode = await fetchContractInternalTx(deployementAddress);
    console.log("DX",dx2,dxInternalDecode)
    console.log("3");
     // console.log("EXEC", deployementAddress);
    // const { dx2, data } = await fetchContractTx(deployementAddress, alchemy);
    
    //Find the value of player 1 move 
    if (dx2.result.length > 2) {
      const { functionName, args } = decodeFunctionData({
        abi: RPS,
        data: dx2.result[2].input, //If there is a solve transaction it will always be the 3rd one. We can just filter for a solve transaction as well but this is optimal for the given problem
      });
      if (functionName === "solve") {
        setGameState({ ...gameState, c1: args[0].toString() });
      }
    }
    // console.log("3");

    //Check if there has been a payout,
    if (contractData.stake===0) {
      if (dxInternalDecode.result.length===2) {
        setGameState({ ...gameState, winner: "tie" });
      } else
        dxInternalDecode.result[0].to &&
          setGameState({ ...gameState, winner: dxInternalDecode.result[0].to });
    }
 
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

  console.log("PRAMA",params)
  return (
    <div>

    </div>
  );
}
