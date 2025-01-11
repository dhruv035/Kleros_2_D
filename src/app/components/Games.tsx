"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAccount, usePublicClient } from "wagmi";
import { formatEther } from "viem";
import { loadDeployments } from "../actions/front-end/deployments";
import contractABI from "../lib/abi/contractabi.json";
import { DeploymentData } from "../lib/types";

export default function Games({ initialDeployments }: { initialDeployments: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [deployments, setDeployments] = useState<string[]>(initialDeployments);
  const [deploymentData, setDeploymentData] = useState<DeploymentData[]>([]);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  // Update deployments list when pathname changes to '/'
  useEffect(() => {
    if (pathname === '/') {
      loadDeployments().then(setDeployments);
    }
  }, [pathname]);

  const updateDeploymentData = useCallback(async () => {
    if (!deployments.length || !publicClient) return;

    try {
      const data: DeploymentData[] = await Promise.all(
        deployments.map((address) => {
          return new Promise<DeploymentData>(async (resolve, reject) => {
            try {
              const [j1, j2, stake] = await Promise.all([
                publicClient.readContract({
                  address: address as `0x${string}`,
                  abi: contractABI.abi,
                  functionName: "j1",
                }),
                publicClient.readContract({
                  address: address as `0x${string}`,
                  abi: contractABI.abi,
                  functionName: "j2",
                }),
                publicClient.readContract({
                  address: address as `0x${string}`,
                  abi: contractABI.abi,
                  functionName: "stake",
                }),
              ]);

              resolve({
                address,
                j1: (j1 as string).toLowerCase(),
                j2: (j2 as string).toLowerCase(),
                stake: stake as bigint,
              });
            } catch (error) {
              console.error('Error fetching contract data:', error);
              reject(error);
            }
          });
        })
      );
      setDeploymentData(data);
    } catch (error) {
      console.error('Error updating deployment data:', error);
    }
  }, [deployments, publicClient]);

  // Update deployment data when deployments change
  useEffect(() => {
    updateDeploymentData();
  }, [deployments, publicClient, updateDeploymentData]);

  // Filter games based on user's address
  const filteredGames = useMemo(() => {
    if (!deploymentData || !address) return [];
    
    const userGames: string[] = [];
    deploymentData.forEach((deployment) => {
      if (deployment.j1 === address.toLowerCase() || deployment.j2 === address.toLowerCase()) {
        userGames.push(deployment.address);
      }
    });
    return userGames;
  }, [address, deploymentData]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full">
      <div className="space-y-8">
        {/* Ongoing Games Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Your Ongoing Games</h2>
          <div className="space-y-4">
            {filteredGames.map((deployment) => {
              const game = deploymentData?.find(d => d.address === deployment);
              return game ? (
                <div
                  key={deployment}
                  onClick={() => router.push(`/play/${deployment}`)}
                  className="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Game Contract: {formatAddress(deployment)}</div>
                      <div className="text-sm text-gray-600">
                        vs {formatAddress(game.j2 === address?.toLowerCase() ? game.j1 : game.j2)}
                      </div>
                    </div>
                    {game.stake !== undefined && (
                      <div className="text-blue-600 font-medium">
                        {formatEther(game.stake)} ETH
                      </div>
                    )}
                  </div>
                </div>
              ) : null;
            })}
            {filteredGames.length === 0 && (
              <div className="text-gray-500 text-center py-4">No ongoing games</div>
            )}
          </div>
        </div>

        {/* Settled Games Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Settled Games</h2>
          <div className="space-y-4">
            {deployments
              .filter((deployment) => !filteredGames.includes(deployment))
              .map((deployment) => {
                const game = deploymentData?.find(d => d.address === deployment);
                return game ? (
                  <div
                    key={deployment}
                    onClick={() => router.push(`/play/${deployment}`)}
                    className="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Game Contract: {formatAddress(deployment)}</div>
                        <div className="text-sm text-gray-600">
                          {formatAddress(game.j1)} vs {formatAddress(game.j2)}
                        </div>
                      </div>
                      {game.stake !== undefined && (
                        <div className="text-blue-600 font-medium">
                          {formatEther(game.stake)} ETH
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })}
            {deployments.filter((deployment) => !filteredGames.includes(deployment)).length === 0 && (
              <div className="text-gray-500 text-center py-4">No settled games</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
