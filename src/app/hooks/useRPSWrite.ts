import { useWriteContract } from "wagmi";
import contractABI from "../lib/abi/contractabi.json";

export const useRPSWrite = (
  contractAddress: `0x${string}`,
  walletAddress?: `0x${string}`,
  setPendingTx?: (hash: `0x${string}` | undefined) => void
) => {
  const { writeContractAsync } = useWriteContract();

  const RPSContract = {
    address: contractAddress,
    abi: contractABI.abi,
  };

  const moveKey = walletAddress ? `${contractAddress.toLowerCase()}:${walletAddress.toLowerCase()}:move:` : "";
  const saltHexKey = walletAddress ? `${contractAddress.toLowerCase()}:${walletAddress.toLowerCase()}:salt:` : "";

  const handlePlay = async (radio: number, stake: bigint) => {
    if (radio === 0) {
      alert("No option Selected");
      return;
    }
    localStorage.setItem(moveKey, radio?.toString());
    try {
      const hash = await writeContractAsync({
        ...RPSContract,
        functionName: "play",
        args: [radio],
        value: stake,
      });
      if (hash && setPendingTx) {
        setPendingTx(hash);
        localStorage.setItem("pendingTx", hash as string);
      }
    } catch (error) {
      console.error('Error playing move:', error);
    }
  };

  const handleReveal = async () => {
    const move = localStorage.getItem(moveKey);
    const saltString = localStorage.getItem(saltHexKey);
    if (!move || !saltString) return;
    const salt = BigInt(saltString);
    try {
      const hash = await writeContractAsync({
        ...RPSContract,
        functionName: "solve",
        args: [parseInt(move), salt],
      });
      if (hash && setPendingTx) {
        setPendingTx(hash);
        localStorage.setItem("pendingTx", hash as string);
      }
    } catch (error) {
      console.error('Error revealing move:', error);
    }
  };

  const handleTimeout = async (hasC2: boolean) => {
    try {
      const hash = await writeContractAsync({
        ...RPSContract,
        functionName: hasC2 ? "j1Timeout" : "j2Timeout",
      });
      if (hash && setPendingTx) {
        setPendingTx(hash);
        localStorage.setItem("pendingTx", hash as string);
      }
    } catch (error) {
      console.error('Error handling timeout:', error);
    }
  };

  return {
    handlePlay,
    handleReveal,
    handleTimeout,
  };
}; 