"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useContext, useMemo, useState } from "react";
import { WalletContext, WalletContextType } from "../context/WalletContext";
import { Deployement } from "../context/TransactionContext";

export default function Games({ deployements }: { deployements: any }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Get a new searchParams string by merging the current
  // searchParams with a provided key/value pair
  const { address } = useContext(WalletContext) as WalletContextType;
  // const createQueryString = useCallback(
  //   (name: string, value: string) => {
  //     const params = new URLSearchParams(searchParams.toString());
  //     params.set(name, value);

  //     return params.toString();
  //   },
  //   [searchParams]
  // );

  const filteredDeployements = useMemo(()=>{
    return deployements.filter((deployement:Deployement)=>{
      return deployement.j1===address||deployement.j2===address
    })
  },[address,deployements])

  const abc = deployements.filter((deployement:Deployement)=>{
    console.log("deployement",deployement)
    return deployement.j1==address||deployement.j2==address
  });
  console.log("deployements",filteredDeployements,abc)
  

  return (
    <div>
      {filteredDeployements &&
        filteredDeployements.length > 0 && ( //List existing Games if in selection stage and previous deployements exists
          <div>
            <p>Select Existing Game </p>
            {filteredDeployements.map((deployement: any, index: any) => (
              <div className="flex flex-row my-2 " key={index}>
                <p>{deployement.address}</p>
                <button
                  className="outline-2 rounded-[10px] bg-blue-300 w-[100px] ml-4 disabled:bg-gray-300"
                  onClick={() => {
                    router.push(
                      `/play/${deployement.address}`
                    );
                  }}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        )}
      <button
        className="border-2 bg-blue-400 disabled:bg-gray-300 rounded-[10px] w-[200px]"
        onClick={() => {router.push(`/create`)}}
      >
        Start New Game
      </button>
    </div>
  );
}
