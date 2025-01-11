"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useBalance, useWalletClient, usePublicClient } from "wagmi";
import { FormState } from "../lib/types";
import RadioGroup from "../components/RadioGroup";
import { moves } from "../lib/const";
import { parseEther, encodePacked, getContractAddress, hashMessage, hexToBigInt, keccak256 } from "viem";
import { TransactionContext } from "../context/TransactionContext";
import { TransactionContextType } from "../lib/types";
import { useContext } from "react";
import { sepolia } from "viem/chains";
import contractABI from "../lib/abi/contractabi.json";
import { commitValidation } from "../utils/validations";

export default function Create() {
  const router = useRouter();
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { data: balance } = useBalance({ address });
  const { isTxDisabled, setPendingTx, setIsTxDisabled } = useContext(TransactionContext) as TransactionContextType;
  const [localDisable, setLocalDisable] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    radio: 0,
    stake: "",
    target: "",
  });

  // Reconnect wallet if there's an active connector
  if (!isConnected && activeConnector) {
    const connector = connectors.find(c => c.id === activeConnector.id);
    if (connector) connect({ connector });
  }

  // If not connected, show connect wallet message
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-xl font-semibold mb-4">Connect your wallet to create a game</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localDisable) return;

    // Validation
    if (!walletClient || !address || !publicClient) {
      alert("Web3 Provider Error");
      return;
    }

    if (!balance) {
      alert("Cannot fetch your balance");
      return;
    }

    if (balance.value < parseEther(formState.stake || "0")) {
      alert("Your stake amount is higher than your balance");
      return;
    }

    setLocalDisable(true);

    try {
      const isValidated = commitValidation(
        formState.radio,
        formState.stake,
        formState.target,
        address
      );

      if (!isValidated) {
        setLocalDisable(false);
        return;
      }

      let signature;
      try {
        signature = await walletClient.signMessage({
          message: Buffer.from(crypto.randomUUID()).toString("base64"),
        });
      } catch (error) {
        setLocalDisable(false);
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

      // Save move and salt
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
        const txHash = await walletClient.deployContract({
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
        setLocalDisable(false);
        return;
      }

      if (!hash) {
        setLocalDisable(false);
        return;
      }

      localStorage.setItem("pendingTx", hash);
      setIsTxDisabled(false);
      setPendingTx(hash);
    } catch (error) {
      setLocalDisable(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto w-full">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-2 font-medium"
          >
            <span>←</span> Back to Games
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Game</h1>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Move Selection */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-4">
                Choose Your Move
              </label>
              <RadioGroup
                radio={formState.radio}
                setRadio={(selection: number) => {
                  setFormState(prev => ({ ...prev, radio: selection }));
                }}
              />
            </div>

            {/* Opponent Address */}
            <div>
              <label
                htmlFor="target"
                className="block text-lg font-medium text-gray-900 mb-2"
              >
                Opponent&apos;s Address
              </label>
              <input
                type="text"
                id="target"
                value={formState.target || ""}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, target: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="Enter opponent's address (0x...)"
                disabled={isTxDisabled || localDisable}
              />
            </div>

            {/* Stake Amount */}
            <div>
              <label
                htmlFor="stake"
                className="block text-lg font-medium text-gray-900 mb-2"
              >
                Stake Amount
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="stake"
                  value={formState.stake}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, stake: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="Enter amount"
                  disabled={isTxDisabled || localDisable}
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ETH
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isTxDisabled || localDisable}
              className="w-full bg-blue-500 text-white py-4 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
            >
              {isTxDisabled || localDisable ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isTxDisabled ? "Transaction in progress..." : "Preparing transaction..."}
                </>
              ) : (
                "Create Game"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
