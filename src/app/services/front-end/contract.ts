"use server";

export const fetchContractInternalTx = async (
  deployementAddress: `0x${string}`
) => {

  const resp = await fetch(
    process.env.NEXT_PUBLIC_ETHERSCAN_URL_SEPOLIA +
      "?" +
      "module=account" +
      "&action=txlistinternal" +
      "&address=" +
      deployementAddress +
      "&startblock=0" +
      "&endblock=99999999" +
      "&page=1" +
      "&offset=10" +
      "&sort=asc" +
      "&apikey=" +
      process.env.ETHERSCAN_KEY_SEPOLIA
  );

  const txInternal = await resp.json();
  return txInternal;
};
export const fetchContractTx = async (deployementAddress: `0x${string}`) => {
  const resp = await fetch(
    process.env.NEXT_PUBLIC_ETHERSCAN_URL_SEPOLIA +
      "?" +
      "module=account" +
      "&action=txlist" +
      "&address=" +
      deployementAddress +
      "&startblock=0" +
      "&endblock=99999999" +
      "&page=1" +
      "&offset=10" +
      "&sort=asc" +
      "&apikey=" +
      process.env.ETHERSCAN_KEY_SEPOLIA
  );
  const txNormal = await resp.json();

  return txNormal;
};
