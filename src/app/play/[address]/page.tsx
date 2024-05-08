"use client";

import contractABI from "../../lib/abi/contractabi.json";
import { moves } from "@/app/lib/const";
import RadioGroup from "@/app/components/RadioGroup";
import {
  TransactionContext,
  TransactionContextType,
} from "@/app/context/TransactionContext";
import { WalletContext, WalletContextType } from "@/app/context/WalletContext";
import { useRPSHooks } from "@/app/hooks/useRPS";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  PublicClient,
  decodeFunctionData,
  formatEther,
  parseEther,
} from "viem";
import {
  fetchContractInternalTx,
  fetchContractTx,
} from "@/app/actions/front-end/contract";
import { useRouter } from "next/navigation";
import { Alchemy, Network } from "alchemy-sdk";

type GameState = {
  c1: string;
  c2: string;
  winner: string;
  timeout: boolean;
  isCreator: boolean;
};

export default function Play({ params }: { params: { address: string } }) {
  const {
    data: contractData,
    j1Timeout,
    j2Timeout,
    play,
    reveal,
  } = useRPSHooks(params.address as `0x${string}`);

  const { address, isConnected, publicClient } = useContext(
    WalletContext
  ) as WalletContextType;

  const { isTxDisabled, setPendingTx } = useContext(
    TransactionContext
  ) as TransactionContextType;

  const [gameState, setGameState] = useState<GameState>({
    c1: "",
    c2: "",
    winner: "",
    timeout: false,
    isCreator: false,
  } as GameState);

  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(-1);
  const [radio, setRadio] = useState<number>(0);
  const [localDisable,setLocalDisable] = useState<boolean>(false);

//Constants to fetch move and salt from localStorage
  const moveKey =
    params?.address.toLowerCase() + ":" + address?.toLowerCase() + ":move:";
  const saltHexKey =
    params?.address.toLowerCase() + ":" + address?.toLowerCase() + ":salt:";

  //Effects

  useEffect(() => {
    //If wallet is disconnected reroute to home page
    if (!isConnected) router.push("/");
  }, [isConnected]);

  //If contract stake changes,specifically goes to zero, inspect the contract internal transactions
  useEffect(() => {
    if (contractData && Number(contractData.stake) === 0) {
      inspectContract(params.address as `0x${string}`);
    }
  }, [params.address, contractData?.stake]);

  //Start the Timer
  useEffect(() => {
    if (!contractData || !contractData.lastAction) return;
    if (Number(contractData.stake) !== 0) {
      setTimeLeft(
        Number(contractData.lastAction) + 300 - Math.floor(Date.now() / 1000)
      );
    }
  }, [contractData?.lastAction]);

  //Run the timer
  useEffect(() => {
    if (gameState.c1 !== "" && gameState.c2 !== "") return;
    let interval: NodeJS.Timeout;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((_timeLeft) => _timeLeft - 1);
      }, 1000);
      if (gameState.timeout === true) {
        setGameState((prevState) => {
          return { ...prevState, timeout: false };
        });
      }
    } else if (gameState.timeout === false)
      setGameState((prevState) => {
        return { ...prevState, timeout: true };
      });
    return () => {
      clearInterval(interval);
    };
  }, [timeLeft]);

  //Check the creator of the game
  useEffect(() => {
    if (!address || !contractData) return;

    const addressFormatted = address.toLocaleLowerCase();
    const j1Formatted = contractData.j1?.toString().toLocaleLowerCase();
    const j2Formatted = contractData.j2?.toString().toLocaleLowerCase();
    if (addressFormatted !== j1Formatted && addressFormatted !== j2Formatted) {
      //If current address is changed to one that is not part of the game auto send to home page
      router.push("/");
    } else {
      if (addressFormatted === j1Formatted) {
        //Check if current address is the owner, store move from local storage in c1 if its owner
        setGameState((prevState) => {
          return {
            ...prevState,
            isCreator: true,
            c1: localStorage.getItem(moveKey) as string,
          };
        });
      } else {
          setGameState((prevState) => {
            return { //If address is not the owner, get player move from contract directly, if c2 exists
              ...prevState,
              isCreator: false,
              c2:contractData.c2?Number(contractData.c2).toString():""
            };
          });
      }
    }
  }, [address, contractData?.c2]);

  
  const inspectContract = async (deploymentAddress: `0x${string}`) => {
    const txInternal = await fetchContractInternalTx(deploymentAddress);
    //Check if the stake has been paid out, if it's paid out means the game has ended
    if (txInternal.length) {
      if (txInternal.length === 2) {
        //Two internal transactions mean it was tie, otherwise just check the recepient of the single internal transaction
        setGameState((prevState) => {
          return { ...prevState, winner: "tie" };
        });
      } else {
        setGameState((prevState) => {
          return { ...prevState, winner: txInternal[0].to as string };
        });

        //Check if it was solved, find the value of c1
        const tx = await fetchContractTx(
          deploymentAddress,
          publicClient as PublicClient
        );
        if (tx?.length === 2) {
          const { functionName, args } = decodeFunctionData({
            abi: contractABI.abi,
            data: tx[1]?.input, //If there is a solve transaction it will always be the 2nd one. We can just filter for a solve transaction as well but this is optimal for the given problem
          });
          if (functionName === "solve" && args && args[0]?.toString()) {
            setGameState((prevState) => {
              return {
                ...prevState,
                c1: args[0]?.toString() ?? "",
                timeout: false,                           
              };
            });
          }
        }
      }
    }
  };

  

  //Validations here are trivial so I have not refactored them into the validation file
  const handlePlay = async () => {
    if (radio === 0) { 
      alert("No option Selected");
      return;
    }
    if (!contractData || typeof contractData.stake !== "bigint") {
      return;
    }
    localStorage.setItem(moveKey, radio?.toString());
    const txHash = await play(radio, contractData.stake);
    if (txHash) {
      setPendingTx(txHash);
      localStorage.setItem("pendingTx", txHash as string);
    }
  };

  const handleReveal = async () => {
    if (!params) return;
    const move = localStorage.getItem(moveKey);
    const saltString = localStorage.getItem(saltHexKey);
    if (!move) return;
    if (!saltString) return;
    ``;
    const salt = BigInt(saltString);
    const txHash = await reveal(parseInt(move), salt);
    if (txHash) {
      setPendingTx(txHash);
      localStorage.setItem("pendingTx", txHash as string);
    }
  };

  const handleTimeout = async () => {
    if (!params) return;
    let txHash;
    if (contractData?.c2) {
      txHash = await j1Timeout();
    } else {
      txHash = await j2Timeout();
    }
    if (txHash) {
      setPendingTx(txHash);
      localStorage.setItem("pendingTx", txHash as string);
    }
  };
  return (
    <div className="flex justify-center">
      {contractData && ( //Dont do any UI until contract is loaded
        <div >
          <button
          //Back Navigation button
            className="mb-4"
            onClick={() => {
              router.push("/");
            }}
          >
            <u>{"<"}Go Back</u>
          </button>

          <div //All current game related data
           className="flex flex-col justify-center">
            <span className="text-center text-3xl font-">GameState</span>
            <div className="flex flex-col text-center">
              Players
              <span>Player 1:{contractData.j1?.toString()}</span>
              <span>Player 2:{contractData.j2?.toString()}</span>
            </div>

            {timeLeft > 0 && (
              <div className="flex flex-col text-center">
                <span>Timer</span>
                {timeLeft}
              </div>
            )}
            <div>
              {Object.keys(gameState).map((key, index) => {
                let value = Object.values(gameState)[index];
                return (
                  <div key={index}>
                    {key} :
                    {key === "c1" || key === "c2"
                      ? moves[Number(value) - 1]
                      : value?.toString()}
                  </div>
                );
              })}
            </div>
          </div>
          {gameState.winner !== "" ? (
            //Concluded State
            <div>
              {gameState.winner?.toLocaleLowerCase() ===
              (address as string)?.toLocaleLowerCase()
                ? "You got the payout"
                : gameState.winner === "tie"
                ? "It was a tie"
                : "You didn't get the payout"}
            </div>
          ) : gameState.timeout ? (
            //Timed out State
            <div>
              {contractData.c2 ? "J1 Timed Out" : "J2 Timed Out"}
              <div>
                <button
                  disabled={isTxDisabled||localDisable}
                  onClick={async() => {
                    setLocalDisable(true)
                    await handleTimeout();
                    setLocalDisable(false);
                  }}
                  className="border-2 mt-4 bg-amber-300 disabled:bg-gray-300 rounded-[10px] w-[80px]"
                >
                  Call Timeout
                </button>
              </div>
            </div>
          ) : gameState.isCreator ? (
            //Reveal State (Creator)
            <div>
              {contractData.c2 ? (
                <button
                  disabled={isTxDisabled||localDisable}
                  onClick={async() => {
                    setLocalDisable(true);
                    await handleReveal();
                    setLocalDisable(false);
                  }}
                  className="border-2 mt-4 bg-amber-300 disabled:bg-gray-300 rounded-[10px] w-[80px]"
                >
                  Reveal Move
                </button>
              ) : (
                <div>Wait for the opponent play</div>
              )}
            </div>
          ) : (
            //Play move State (Player 2)
            <div>
              {contractData.c2 ? (
                <div>Wait for the opponent to reveal</div>
              ) : (
                <div>
                  <RadioGroup radio={radio} setRadio={setRadio} />
                  <button
                    disabled={isTxDisabled||localDisable}
                    className="border-2 mt-4 bg-amber-300 disabled:bg-gray-300 rounded-[10px] w-[80px]"
                    onClick={async() => {
                      setLocalDisable(true);
                      await handlePlay();
                      setLocalDisable(false);
                    }}
                  >
                    Play
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
