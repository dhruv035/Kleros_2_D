"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { WalletContext, WalletContextType } from "../context/WalletContext";
import { Deployment } from "../context/TransactionContext";
import contractABI from "../lib/abi/contractabi.json";

type DeploymentData = {
  address: string;
  j1: string;
  j2: string;
  stake?: number;
};
export default function Games({ deployments }: { deployments: string[] }) {
  const router = useRouter();
  const [deploymentData, setDeploymentData] = useState<
    DeploymentData[] | null
  >();
  const { address, publicClient } = useContext(
    WalletContext
  ) as WalletContextType;

  const filteredDeployments = useMemo(() => {
    if (!deploymentData) return;
    return deploymentData.reduce(
      (filtered: string[], deployment: DeploymentData) => {
        if (deployment.j1 === address || deployment.j2 === address)
          filtered.push(deployment.address);
        return filtered;
      },
      []
    );
  }, [address, deploymentData]);

  const data = useMemo(() => {
    if (!deploymentData || !address) return;
    const settled: string[] = [];
    const ongoing: string[] = [];
    deploymentData.forEach((deployment) => {
      if (deployment.j1 === address || deployment.j2 === address)
        if (deployment.stake === 0) settled.push(deployment.address);
        else ongoing.push(deployment.address);
    });
    return { settled, ongoing };
  }, [address, deploymentData]);
  useEffect(() => {
    updateDeploymentData();
  }, [deployments]);

  //Get players for the deployement addresses
  const updateDeploymentData = async () => {
    if (!publicClient) return;

    const data: DeploymentData[] = await Promise.all(
      deployments.map((data: string) => {
        return new Promise<DeploymentData>(async (resolve, reject) => {
          let j1, j2, stake;
          try {
            j2 = await publicClient.readContract({
              address: data as `0x${string}`,
              abi: contractABI.abi,
              functionName: "j2",
            });
            j1 = await publicClient.readContract({
              address: data as `0x${string}`,
              abi: contractABI.abi,
              functionName: "j1",
            });
            stake = await publicClient.readContract({
              address: data as `0x${string}`,
              abi: contractABI.abi,
              functionName: "stake",
            });
          } catch (error) {
            (j2 = ""), (j1 = ""), (stake = 0);
          }

          const fetchData = {
            address: data,
            j2: j2 as string,
            j1: j1 as string,
            stake: Number(stake),
          };
          resolve(fetchData);
        });
      })
    );
    setDeploymentData(data);
  };

  console.log("data", data?.settled, data?.ongoing);
  return (
    <div className="flex flex-col">
      {data && (
        <div>
          {data.ongoing &&
            data.ongoing.length > 0 && ( //List existing Games if in selection stage and previous deployments exists
              <div>
                <p>Ongoing Games </p>
                {data.ongoing.map((deployment: any, index: any) => (
                  <div className="flex flex-row my-2 " key={index}>
                    <p>{deployment}</p>
                    <button
                      className="outline-2 rounded-[10px] bg-blue-300 w-[100px] ml-4 disabled:bg-gray-300"
                      onClick={() => {
                        router.push(`/play/${deployment}`);
                      }}
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}
          {data.settled &&
            data.settled.length > 0 && ( //List existing Games if in selection stage and previous deployments exists
              <div>
                <p>Settled Games </p>
                {data.settled.map((deployment: any, index: any) => (
                  <div className="flex flex-row my-2 " key={index}>
                    <p>{deployment}</p>
                    <button
                      className="outline-2 rounded-[10px] bg-blue-300 w-[100px] ml-4 disabled:bg-gray-300"
                      onClick={() => {
                        router.push(`/play/${deployment}`);
                      }}
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}
      <button
        className="border-2 self-center mt-6 bg-blue-400 disabled:bg-gray-300 rounded-[10px] w-[200px]"
        onClick={() => {
          router.push(`/create`);
        }}
      >
        Start New Game
      </button>
    </div>
  );
}
