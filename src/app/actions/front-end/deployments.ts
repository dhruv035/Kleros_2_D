"use server";

import { cookies } from "next/headers";
import clientPromise from "../backend/database";
import { Deployment } from "../../lib/types";

export const loadDeployments = async () => {
  const _cookies = cookies()
  //This code is to pull contract data from backend, it will help in hiding the keys
  // const publicClient = createPublicClient({
  //   chain: sepolia,
  //   transport: http(
  //     `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
  //   ),
  // });

  // if (!publicClient) return;

  const client = await clientPromise;
  const db = client.db("Bot");
  const result = (await db.collection("Deployments").find({}).sort([['_id', -1]]).toArray()).map(
    (element) => {
      return element.address;
    }
  );

  //This was to fetch j1 and j2 on the backend but I decided to move this logic to front to establish further front end independence
  // const data = await Promise.all(
  //   result.map((data: any) => {
  //     return new Promise(async (resolve, reject) => {
  //       data._id = data._id.toString();
  //       let j1, j2;
  //       try {
  //         j2 = await publicClient.readContract({
  //           address: data.address as `0x${string}`,
  //           abi: RPS,
  //           functionName: "j2",
  //         });
  //         j1 = await publicClient.readContract({
  //           address: data.address as `0x${string}`,
  //           abi: RPS,
  //           functionName: "j1",
  //         });
  //       } catch (error) {
  //         (j2 = ""), (j1 = "");
  //       }

  //       const fetchData = { address:data.address, j2, j1 };
  //       resolve(fetchData);
  //     });
  //   })
  // );

  return result;
};

export const addDeployment = async (data: { address: string }) => {
  const _cookies = cookies()
  const client = await clientPromise;
  const db = client.db("Bot");
  try {
    const data2 = await db.collection("Deployments").insertOne(data);
  } catch (error) {
  }
};

export const removeDeployment = async (data: Deployment) => {
  const _cookies = cookies()
  const result = await fetch("/api", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return await result.json();
};
