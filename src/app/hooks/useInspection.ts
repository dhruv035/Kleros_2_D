import { useEffect, useState } from "react";
import { inspectContract } from "../services/inspectionService";
import { usePublicClient } from "wagmi";
import { InspectionResult } from "../lib/types";

export const useInspection = (address: string | undefined, isGameClosed: boolean) => {
  const [isInspecting, setIsInspecting] = useState(false);
  const [result, setResult] = useState<InspectionResult>({ isEnded: false, winner: "" });
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!address || !isGameClosed || !publicClient) return;

    setIsInspecting(true);
    inspectContract(address as `0x${string}`, publicClient)
      .then(setResult)
      .finally(() => setIsInspecting(false));
  }, [address, isGameClosed, publicClient]);

  return { isInspecting, result };
}; 