"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAccount, usePublicClient } from "wagmi";
import { formatEther } from "viem";
import { loadDeployments } from "../actions/front-end/deployments";
import contractABI from "../lib/abi/contractabi.json";
import { DeploymentData } from "../lib/types";

const GAMES_PER_PAGE = 5;

export default function Games({ initialDeployments }: { initialDeployments: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [deployments, setDeployments] = useState<string[]>(initialDeployments);
  const [deploymentData, setDeploymentData] = useState<DeploymentData[]>([]);
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [ongoingPage, setOngoingPage] = useState(0);
  const [settledPage, setSettledPage] = useState(0);

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

  // Filter games based on user's address and game state
  const { ongoingGames, settledGames } = useMemo(() => {
    if (!deploymentData || !address) return { ongoingGames: [], settledGames: [] };
    
    const ongoing: string[] = [];
    const settled: string[] = [];
    
    deploymentData.forEach((deployment) => {
      const isUserGame = deployment.j1 === address.toLowerCase() || deployment.j2 === address.toLowerCase();
      const isSettled = deployment.stake === BigInt(0);
      
      if (isUserGame) {
        if (isSettled) {
          settled.push(deployment.address);
        } else {
          ongoing.push(deployment.address);
        }
      }
    });
    
    return { ongoingGames: ongoing, settledGames: settled };
  }, [address, deploymentData]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get paginated games
  const paginatedOngoingGames = ongoingGames.slice(
    ongoingPage * GAMES_PER_PAGE,
    (ongoingPage + 1) * GAMES_PER_PAGE
  );

  const paginatedSettledGames = settledGames.slice(
    settledPage * GAMES_PER_PAGE,
    (settledPage + 1) * GAMES_PER_PAGE
  );

  const PaginationControls = ({ 
    currentPage, 
    setPage, 
    totalItems, 
    label 
  }: { 
    currentPage: number; 
    setPage: (page: number) => void; 
    totalItems: number;
    label: string;
  }) => {
    const totalPages = Math.ceil(totalItems / GAMES_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 text-sm">
        <button
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-gray-600">
          {label} {currentPage + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full">
      <div className="flex flex-row gap-8">
        {/* Ongoing Games Section */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Your Ongoing Games</h2>
          <div className="space-y-4">
            {paginatedOngoingGames.map((deployment) => {
              const game = deploymentData?.find(d => d.address === deployment);
              return game ? (
                <div
                  key={deployment}
                  onClick={() => router.push(`/play/${deployment}`)}
                  className="group bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-blue-50 hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-200"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-grow">
                      <div className="font-medium group-hover:text-blue-600 transition-colors">
                        Game Contract: {formatAddress(deployment)}
                      </div>
                      <div className="text-sm text-gray-600 group-hover:text-blue-500 transition-colors">
                        vs {formatAddress(game.j2 === address?.toLowerCase() ? game.j1 : game.j2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {game.stake !== undefined && (
                        <div className="text-blue-600 font-medium whitespace-nowrap">
                          {formatEther(game.stake)} ETH
                        </div>
                      )}
                      <div className="text-gray-300 group-hover:text-blue-500 transition-colors text-4xl font-light translate-y-[-2px]">
                        ›
                      </div>
                    </div>
                  </div>
                </div>
              ) : null;
            })}
            {ongoingGames.length === 0 && (
              <div className="text-gray-500 text-center py-4">No ongoing games</div>
            )}
            <PaginationControls
              currentPage={ongoingPage}
              setPage={setOngoingPage}
              totalItems={ongoingGames.length}
              label="Page"
            />
          </div>
        </div>

        {/* Settled Games Section */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Settled Games</h2>
          <div className="space-y-4">
            {paginatedSettledGames.map((deployment) => {
              const game = deploymentData?.find(d => d.address === deployment);
              return game ? (
                <div
                  key={deployment}
                  onClick={() => router.push(`/play/${deployment}`)}
                  className="group bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-blue-50 hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-200"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-grow">
                      <div className="font-medium group-hover:text-blue-600 transition-colors">
                        Game Contract: {formatAddress(deployment)}
                      </div>
                      <div className="text-sm text-gray-600 group-hover:text-blue-500 transition-colors">
                        {formatAddress(game.j1)} vs {formatAddress(game.j2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-gray-500 font-medium group-hover:text-blue-500 transition-colors whitespace-nowrap">
                        Game Completed
                      </div>
                      <div className="text-gray-300 group-hover:text-blue-500 transition-colors text-4xl font-light translate-y-[-2px]">
                        ›
                      </div>
                    </div>
                  </div>
                </div>
              ) : null;
            })}
            {settledGames.length === 0 && (
              <div className="text-gray-500 text-center py-4">No settled games</div>
            )}
            <PaginationControls
              currentPage={settledPage}
              setPage={setSettledPage}
              totalItems={settledGames.length}
              label="Page"
            />
          </div>
        </div>
      </div>

      {/* Start New Game Button */}
      <button
        onClick={() => router.push('/create')}
        className="w-full mt-8 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
      >
        Start New Game
      </button>
    </div>
  );
}
