"use server";

import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import clientPromise from "../backend/database";
import { RPS } from "@/app/lib/abi";

export type Deployement = {
  address: string;
  j1: string;
  j2?: string;
};

export const loadDeployements = async () => {
  const client = await clientPromise;
  const db = client.db("Bot");
  const result = await db.collection("Deployements").find({}).toArray();
  console.log("DATAAA",result)
  return result;
};

export const addDeployement = async (data: {
  address: string;
  j1: string;
  j2: string;
}) => {
  const client = await clientPromise;
  const db = client.db("Bot");
  try {
    console.log("HEREEE",data)
    const data2 = await db.collection("Deployements").insertOne(data);
  } catch (error) {
    console.log("ERROR", error);
  }
};

export const removeDeployement = async (data: Deployement) => {
  const result = await fetch("/api", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return await result.json();
};
