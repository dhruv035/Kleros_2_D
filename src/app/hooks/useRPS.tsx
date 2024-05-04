import { useReadContracts, useWriteContract } from "wagmi";
import contractabi from "../lib/abi/contractabi.json";



//This a facade pattern refactoring for the contract, the functions on the contract are simplified for easy use
//Since the underlying functions are hooks this facade is in the form of hooks
const useRPSHooks = (contractAddress: `0x${string}`) => {
  //Our contract info
  const RPSContract = {
    address: contractAddress,
    abi: contractabi.abi,
  };

  //Write functions
  const { writeContractAsync } = useWriteContract();

  //

  const j1Timeout = async ()=>{
    let txHash;
    try {
      const hash = await writeContractAsync({
        ...RPSContract,
        functionName: "j1Timeout",
      });
      txHash = hash;
    } catch (error) {
      console.log("HEY", error);
      return;
    }
    return txHash;
  }

  const j2Timeout = async()=> {
    let txHash;
    try {
      const hash = await writeContractAsync({
        ...RPSContract,
        functionName: "j2Timeout",
      });
      txHash = hash;
    } catch (error) {
      console.log("HEY", error);
      return;
    }
  }

  const reveal = async () => {

    try {
      const txHash = await writeContractAsync({
        address: params.address as `0x${string}`,
        abi: RPS,
        functionName: "solve",
        args: [parseInt(move), salt],
      });
      hash = txHash;
    } catch (error) {
      return;
    }

  }

  // A generic timeout function since anyone can the timeout function
  // const handleTimeout = async (isCreator: boolean) => {
  //   let txHash;
  //   if (isCreator) {
  //     try {
  //       const hash = await writeContractAsync({
  //         ...RPSContract,
  //         functionName: "j1Timeout",
  //       });
  //       txHash = hash;
  //     } catch (error) {
  //       console.log("HEY", error);
  //       return;
  //     }
  //   } else {
  //     try {
  //       const hash = await writeContractAsync({
  //         ...RPSContract,
  //         functionName: "j2Timeout",
  //       });
  //       txHash = hash;
  //     } catch (error) {
  //       console.log("HEY", error);
  //       return;
  //     }
  //   }
  // };
  const { data } = useReadContracts({
    contracts: [
      {
        ...RPSContract,
        functionName: "j1",
      },
      {
        ...RPSContract,
        functionName: "j2",
      },
      {
        ...RPSContract,
        functionName: "lastAction",
      },
      {
        ...RPSContract,
        functionName: "c2",
      },
      {
        ...RPSContract,
        functionName: "stake",
      },
    ],
    query: {
      refetchInterval: 5000,
      select: (data) => {
        return {
          j1: data[0].result,
          j2: data[1].result,
          lastAction: data[2].result,
          c2: data[3].result,
          stake: data[4].result,
        };
      },
    },
  });

  return { data, writeContractAsync };
};

export { useRPSHooks };
