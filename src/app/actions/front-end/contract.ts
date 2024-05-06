"use server";
import { Alchemy, AssetTransfersCategory, Network, TransactionResponse } from "alchemy-sdk";
import { PublicClient, Transaction } from "viem";

const config = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY, // Replace with your API key
  network: Network.ETH_SEPOLIA, // Replace with your network
};

// Creates an Alchemy object instance with the config to use for making requests
const alchemy = new Alchemy(config);

export const fetchContractInternalTx = async (
  deploymentAddress: `0x${string}`,
) => {

  let response = await alchemy.core.getAssetTransfers({
    fromBlock: "0x0",
    fromAddress: deploymentAddress as string,
    category: ["internal" as AssetTransfersCategory],
  });
  return response.transfers;
};
export const fetchContractTx = async (
  deploymentAddress: `0x${string}`,
  publicClient:PublicClient
) => {
  let response = await alchemy.core.getAssetTransfers({
    fromBlock: "0x0",
    excludeZeroValue: false,
    toAddress: deploymentAddress as string,
    category: ["external" as AssetTransfersCategory],
  });
  const data = await Promise.all(
    response.transfers.map((element) => {
      
      return publicClient.getTransaction({hash:element.hash as `0x${string}`})
    })
  );
  if(data.length)
    return data;
  else
  return [] as Transaction[];
};
