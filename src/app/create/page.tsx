"use client";

import {
  encodePacked,
  getContractAddress,
  hashMessage,
  hexToBigInt,
  keccak256,
  parseEther,
} from "viem";
import RadioGroup from "../components/RadioGroup";
import contractabi from "../lib/abi/contractabi.json";
import { useContext, useState } from "react";
import {
  TransactionContext,
  TransactionContextType,
} from "../context/TransactionContext";
import { WalletContext, WalletContextType } from "../context/WalletContext";
import { sepolia } from "viem/chains";
import { useRPSHooks } from "../hooks/useRPS";
import { commitValidation } from "../utils/validations";
import { RPS } from "../lib/abi";

export type FormState = {
  radio: number;
  stake: string;
  target: string | null;
};
export default function Create() {
  //


  
  const [formState, setFormState] = useState<FormState>({
    radio: 0,
    stake: "",
  } as FormState);

  const { client, publicClient, balance, address } = useContext(
    WalletContext
  ) as WalletContextType;
  const {
    isTxDisabled,
    pendingTx,
    setPendingTx,
    setIsTxDisabled,
  } = useContext(TransactionContext) as TransactionContextType;

  const handleCommit = async () => {
    if (!balance) {
      alert("Cannot Fetch your balance");
      return;
    }
    if (client?.chain?.id !== 11155111 || !address || !publicClient) {
      alert("Web3 Provider Error");
      return;
    }
    const isValidated = commitValidation(
      formState.radio,
      balance.value,
      formState.stake,
      formState.target,
      address as string
    );

    if (!isValidated) return;

    const signature = await client?.signMessage({
      account: address,
      message: Buffer.from(crypto.randomUUID()).toString("base64"),
    });

    if (!signature) return;

    const salt = hexToBigInt(hashMessage(signature));

    const c1Hash = keccak256(
      encodePacked(["uint8", "uint256"], [formState.radio, salt])
    );

    const txNonce = await publicClient.getTransactionCount({
      address: address,
    });

    const deployAddress = getContractAddress({
      from: address,
      nonce: BigInt(txNonce),
    });

    localStorage.setItem(
      deployAddress.toLowerCase() + ":" + address.toLowerCase() + ":move:",
      formState.radio.toString()
    );
    localStorage.setItem(
      deployAddress.toLowerCase() + ":" + address.toLowerCase() + ":salt:",
      salt.toString()
    );
    let hash;
    try {
      const txHash = await client?.deployContract({
        chain: sepolia,
        abi: RPS,
        account: address,
        args: [c1Hash, formState.target as `0x${string}`],
        value: parseEther(formState.stake),
        bytecode: contractabi.bytecode as `0x${string}`,
      });
      hash = txHash;
    } catch (error) {
      setIsTxDisabled(false);
      return;
    }

    if (!hash) return;
    setIsTxDisabled(false);
    setPendingTx(hash);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col">
        <RadioGroup
          radio={formState.radio}
          setRadio={(selection: number) => {
            setFormState({ ...formState, radio: selection });
          }}
        />

        <label className="mt-4">Enter amount to Stake</label>
        <input
          value={formState.stake}
          className="border-2 rounded-[10px]"
          type="number"
          onChange={(e) => {
            setFormState({ ...formState, stake: e.target.value.toString() });
          }}
          step={0.001}
        ></input>
        <label className="mt-4">Enter address to challenge</label>
        <input
          className="border-2 rounded-[10px]"
          type="string"
          onChange={(e) => {
            setFormState({ ...formState, target: e.currentTarget.value });
          }}
          step={0.001}
        ></input>
        <button
          disabled={isTxDisabled}
          className="border-2 mt-4 bg-amber-300 disabled:bg-gray-300 rounded-[10px] w-[80px]"
          onClick={() => {
            handleCommit();
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
