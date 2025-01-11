import { PublicClient, decodeFunctionData } from "viem";
import { fetchContractInternalTx, fetchContractTx } from "../actions/front-end/contract";
import contractABI from "../lib/abi/contractabi.json";
import { InspectionResult } from "../lib/types";

export const inspectContract = async (
  deploymentAddress: `0x${string}`,
  publicClient: PublicClient
): Promise<InspectionResult> => {
  try {
    const txInternal = await fetchContractInternalTx(deploymentAddress);
    const tx = await fetchContractTx(deploymentAddress, publicClient);

    // If there are internal transactions, the game has ended
    if (txInternal.length) {
      // Check if it's a timeout case
      if (tx && tx.length > 0) {
        const lastTx = tx[tx.length - 1];
        const { functionName } = decodeFunctionData({
          abi: contractABI.abi,
          data: lastTx?.input,
        });

        // If the last transaction was a timeout call
        if (functionName === "j1Timeout" || functionName === "j2Timeout") {
          return {
            isEnded: true,
            winner: (txInternal[0].to as string).toLowerCase(),
            isTimeout: true,
            moveRevealed: false
          };
        }
      }

      // If there are two payouts, it's a tie
      if (txInternal.length === 2) {
        // Find the solve transaction to get Player 1's move
        const solveTx = tx?.find(t => {
          const decoded = decodeFunctionData({
            abi: contractABI.abi,
            data: t?.input,
          });
          return decoded.functionName === "solve";
        });

        const move = solveTx ? decodeFunctionData({
          abi: contractABI.abi,
          data: solveTx?.input,
        }).args?.[0]?.toString() : undefined;

        return { 
          isEnded: true, 
          winner: "tie",
          c1: move,
          moveRevealed: !!move
        };
      }

      // Look for solve transaction to get Player 1's move
      const solveTx = tx?.find(t => {
        const decoded = decodeFunctionData({
          abi: contractABI.abi,
          data: t?.input,
        });
        return decoded.functionName === "solve";
      });

      if (solveTx) {
        const { args } = decodeFunctionData({
          abi: contractABI.abi,
          data: solveTx?.input,
        });
        return {
          isEnded: true,
          winner: (txInternal[0].to as string).toLowerCase(),
          c1: args?.[0]?.toString(),
          moveRevealed: true
        };
      }

      // Single winner case without reveal
      return { 
        isEnded: true, 
        winner: (txInternal[0].to as string).toLowerCase(),
        moveRevealed: false
      };
    }

    return { isEnded: false, winner: "" };
  } catch (error) {
    console.error('Error inspecting contract:', error);
    return { isEnded: false, winner: "" };
  }
};