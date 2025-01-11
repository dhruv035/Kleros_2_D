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
import contractABI from "../lib/abi/contractabi.json";
import { useContext, useEffect, useState } from "react";
import {
  TransactionContext,
  TransactionContextType,
} from "../context/TransactionContext";
import { WalletContext, WalletContextType } from "../context/WalletContext";
import { sepolia } from "viem/chains";
import { commitValidation } from "../utils/validations";
import { useReconnect } from "wagmi";
import { useRouter } from "next/navigation";
import { moves } from "../lib/const";

export type FormState = {
  radio: number;
  stake: string;
  target: string | null;
  savedMove?: string;
};

export default function Create() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({
    radio: 0,
    stake: "",
    target: null,
  });

  const [localDisable, setLocalDisable] = useState<boolean>(false);
  const { client, publicClient, balance, address } = useContext(
    WalletContext
  ) as WalletContextType;
  const { isTxDisabled, pendingTx, setPendingTx, setIsTxDisabled } = useContext(
    TransactionContext
  ) as TransactionContextType;

  // Check for saved move only if we have a pending transaction
  useEffect(() => {
    const pendingTxHash = localStorage.getItem("pendingTx");
    if (!pendingTxHash || !address) return;

    // Check if we have a saved move for this pending transaction
    const moveKey = pendingTxHash.toLowerCase() + ":" + address.toLowerCase() + ":move:";
    const savedMoveValue = localStorage.getItem(moveKey);
    
    if (savedMoveValue) {
      const moveIndex = parseInt(savedMoveValue);
      setFormState(prev => ({
        ...prev,
        radio: moveIndex,
        savedMove: moves[moveIndex - 1]
      }));
    }
  }, [address]);

  const handleCommit = async () => {
    if (client?.chain?.id !== 11155111 || !address || !publicClient) {
      alert("Web3 Provider Error");
      return;
    }
    const isValidated = commitValidation(
      formState.radio,
      balance,
      formState.stake,
      formState.target,
      address as string
    );

    if (!isValidated) return;
    let signature;
    try {
      signature = await client?.signMessage({
        account: address,
        message: Buffer.from(crypto.randomUUID()).toString("base64"),
      });
    } catch (error) {
      return;
    }

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

    // Save move and update state
    const moveKey = deployAddress.toLowerCase() + ":" + address.toLowerCase() + ":move:";
    localStorage.setItem(moveKey, formState.radio.toString());
    setFormState(prev => ({ ...prev, savedMove: moves[formState.radio - 1] }));

    localStorage.setItem(
      deployAddress.toLowerCase() + ":" + address.toLowerCase() + ":salt:",
      salt.toString()
    );
    let hash;
    try {
      const txHash = await client?.deployContract({
        chain: sepolia,
        abi: contractABI.abi,
        account: address,
        args: [c1Hash, formState.target as `0x${string}`],
        value: parseEther(formState.stake),
        bytecode: contractABI.bytecode as `0x${string}`,
      });
      hash = txHash;
    } catch (error) {
      setIsTxDisabled(false);
      return;
    }

    if (!hash) return;
    localStorage.setItem("pendingTx", hash as string);
    setIsTxDisabled(false);
    setPendingTx(hash);
  };

  const { reconnect } = useReconnect();

  useEffect(() => {
    //Wagmi reconnect wallet
    reconnect();
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-4">
      <div className="w-full flex justify-start mb-6">
        <button
          onClick={() => router.push("/")}
          className="text-blue-500 hover:text-blue-700"
        >
          <u>{"<"} Go Back</u>
        </button>
      </div>

      <div className="w-full flex flex-col items-center gap-6">
        <div className="text-2xl font-semibold text-center">
          Create New Game
        </div>

        <div className="w-full max-w-md bg-gray-50 rounded-lg p-6 space-y-6">
          {/* Game Moves Display */}
          {formState.savedMove && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-gray-600 font-medium">Your Move:</div>
              <div className="text-lg font-semibold text-blue-700">{formState.savedMove}</div>
            </div>
          )}

          {/* Game Creation Form */}
          {!formState.savedMove && (
            <div className="space-y-4">
              <div>
                <div className="text-lg font-medium mb-2">Choose your move:</div>
                <RadioGroup
                  radio={formState.radio}
                  setRadio={(selection: number) => {
                    setFormState(prev => ({ ...prev, radio: selection }));
                  }}
                />
              </div>

              <div>
                <label className="block text-lg font-medium mb-2">
                  Stake (ETH):
                </label>
                <input
                  type="text"
                  value={formState.stake}
                  onChange={(e) =>
                    setFormState(prev => ({ ...prev, stake: e.target.value }))
                  }
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter stake amount"
                  disabled={isTxDisabled}
                />
              </div>

              <div>
                <label className="block text-lg font-medium mb-2">
                  Opponent's Address:
                </label>
                <input
                  type="text"
                  value={formState.target || ""}
                  onChange={(e) =>
                    setFormState(prev => ({ ...prev, target: e.target.value }))
                  }
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter opponent's address"
                  disabled={isTxDisabled}
                />
              </div>

              <button
                onClick={handleCommit}
                disabled={isTxDisabled}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isTxDisabled ? "Processing..." : "Create Game"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
