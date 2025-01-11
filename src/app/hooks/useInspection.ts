import { useContext, useEffect, useState } from "react";
import { inspectContract, InspectionResult } from "../services/inspectionService";
import { WalletContext, WalletContextType } from "../context/WalletContext";

export const useInspection = (address: string | undefined, isGameClosed: boolean) => {
  const [isInspecting, setIsInspecting] = useState(false);
  const [result, setResult] = useState<InspectionResult>({ isEnded: false, winner: "" });
  const { publicClient } = useContext(WalletContext) as WalletContextType;

  useEffect(() => {
    if (!address || !isGameClosed || !publicClient) return;

    setIsInspecting(true);
    inspectContract(address as `0x${string}`, publicClient)
      .then(setResult)
      .finally(() => setIsInspecting(false));
  }, [address, isGameClosed, publicClient]);

  return { isInspecting, result };
}; 