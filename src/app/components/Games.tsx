"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import contractABI from "../lib/abi/contractabi.json";
import { loadDeployments } from "../actions/front-end/deployments";

type DeploymentData = {
  address: string;
  j1: string;
  j2: string;
  stake?: number;
};

export default function Games({ initialDeployments }: { initialDeployments: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [deployments, setDeployments] = useState<string[]>(initialDeployments);
  const [deploymentData, setDeploymentData] = useState<DeploymentData[] | null>();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const refreshDeployments = useCallback(async () => {
    const data = await loadDeployments();
    setDeployments(data ?? []);
  }, []);

  const updateDeploymentData = useCallback(async () => {
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
            console.error('Error fetching contract data:', error);
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
  }, [publicClient, deployments]);

  useEffect(() => {
    // Refresh deployments when component mounts or when user navigates back
    const handleFocus = () => {
      refreshDeployments();
    };

    // Listen for window focus events
    window.addEventListener('focus', handleFocus);

    // Initial load
    refreshDeployments();

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshDeployments]);

  // Refresh when pathname changes to '/' (home)
  useEffect(() => {
    if (pathname === '/') {
      refreshDeployments();
    }
  }, [pathname, refreshDeployments]);

  useEffect(() => {
    if (!publicClient || !deployments.length) return;
    updateDeploymentData();
  }, [deployments, publicClient, updateDeploymentData]);

  const data = useMemo(() => {
    if (!deploymentData || !address) return;
    const settled: string[] = [];
    const ongoing: string[] = [];
    deploymentData.forEach((deployment) => {
      if (deployment.j1.toLowerCase() === address.toLowerCase() || deployment.j2.toLowerCase() === address.toLowerCase())
        if (deployment.stake === 0) settled.push(deployment.address);
        else ongoing.push(deployment.address);
    });
    return { settled, ongoing };
  }, [address, deploymentData]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatStake = (stake: number) => {
    return `${stake.toString().padStart(19, '0').slice(0, -18)}.${stake.toString().padStart(19, '0').slice(-18).replace(/0+$/, '')} ETH`;
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full">
      {data ? (
        <div className="space-y-8">
          {data.ongoing && data.ongoing.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Ongoing Games</h2>
              <div className="space-y-3">
                {data.ongoing.map((deployment: any, index: any) => {
                  const game = deploymentData?.find(d => d.address === deployment);
                  return (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-gray-700">{formatAddress(deployment)}</p>
                        {game?.stake !== undefined && (
                          <p className="text-sm text-gray-600">Stake: {formatStake(game.stake)}</p>
                        )}
                      </div>
                      <button
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        onClick={() => {
                          router.push(`/play/${deployment}`);
                        }}
                      >
                        Select
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {data.settled && data.settled.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Settled Games</h2>
              <div className="space-y-3">
                {data.settled.map((deployment: any, index: any) => {
                  const game = deploymentData?.find(d => d.address === deployment);
                  return (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-gray-700">{formatAddress(deployment)}</p>
                        <p className="text-sm text-gray-600">Game Completed</p>
                      </div>
                      <button
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        onClick={() => {
                          router.push(`/play/${deployment}`);
                        }}
                      >
                        Select
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-gray-500">Loading games...</p>
        </div>
      )}
      
      <button
        className="mt-8 w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
        onClick={() => {
          router.push(`/create`);
        }}
      >
        Start New Game
      </button>
    </div>
  );
}
