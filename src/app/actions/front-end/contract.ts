import { Alchemy, AssetTransfersCategory, TransactionResponse } from "alchemy-sdk";
import { PublicClient, Transaction } from "viem";

export const fetchContractInternalTx = async (
  deploymentAddress: `0x${string}`,
  alchemy: Alchemy
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
  alchemy: Alchemy,
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
  console.log("")
  if(data.length)
    return data;
  else
  return [] as Transaction[];
};
