"use client";

import { RPS } from "@/app/lib/abi";
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
  const { isTxDisabled, setIsTxDisabled, setPendingTx } = useContext(
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

  useEffect(() => {
    if (!contractData || !contractData.lastAction) return;
    if (Number(contractData.stake) !== 0) {
      setTimeLeft(
        Number(contractData.lastAction) + 300 - Math.floor(Date.now() / 1000)
      );
    }
  }, [contractData?.lastAction]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((_timeLeft) => _timeLeft - 1);
      }, 1000);
      if (gameState.timeout === true) {
        const newStruct = { ...gameState, timeout: false };
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
  useEffect(() => {
    if (!address || !contractData) return;

    if (address !== contractData.j1 && address !== contractData.j2) {
      //If current address is changed to one that is not part of the game auto send to home page
      router.push("/");
    } else {
      if (address === contractData.j1) {
        console.log("HI");
        //Check if current address is the owner
        setGameState((prevState) => {
          return {
            ...prevState,
            isCreator: true,
            c1: localStorage.getItem(moveKey) as string,
          };
        });
      } else {
        console.log("address", address, contractData.j1);
        if (contractData.c2)
          setGameState((prevState) => {
            return {
              ...prevState,
              isCreator: false,
              c2: Number(contractData.c2).toString(),
            };
          });
        else
          setGameState((prevState) => {
            return {
              ...prevState,
              isCreator: false,
            };
          });
      }
    }
  }, [address, contractData?.c2, contractData?.j1]);

  //Constants to fetch move and salt from localStorage
  const moveKey =
    params?.address.toLowerCase() + ":" + address?.toLowerCase() + ":move:";
  const saltHexKey =
    params?.address.toLowerCase() + ":" + address?.toLowerCase() + ":salt:";

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
        if (tx?.length > 2) {
          const { functionName, args } = decodeFunctionData({
            abi: RPS,
            data: tx[2]?.input, //If there is a solve transaction it will always be the 3rd one. We can just filter for a solve transaction as well but this is optimal for the given problem
          });
          if (functionName === "solve") {
            setGameState((prevState) => {
              return { ...prevState, c1: args[0].toString() };
            });
          }
        }
      }
    }
  };

  const handlePlay = async () => {
    if (radio === 0) {
      alert("No option Selected");
      return;
    }
    if (!contractData || typeof contractData.stake !== "bigint") {
      return;
    }
    localStorage.setItem(moveKey, radio.toString());
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
  console.log("C1", gameState);
  return (
    <div>
      {contractData && (
        <div>
          <button
            onClick={() => {
              router.push("/");
            }}
          >
            Home
          </button>
          {timeLeft > 0 && <div>{timeLeft}</div>}
          <div>
            GameState
            <div>
              {Object.keys(gameState).map((key, index) => {
                let value = Object.values(gameState)[index];
                console.log("LHER", key, value);
                return (
                  <div key={index}>
                    {key} :{value.toString()}
                  </div>
                );
              })}
            </div>
          </div>
          {gameState.winner !== "" ? (
            //Concluded State
            <div>
              {gameState.winner.toLocaleLowerCase() ===
              (address as string).toLocaleLowerCase()
                ? "You got the payout"
                : "You didn't get the payout"}
            </div>
          ) : gameState.timeout ? (
            //Timed out State
            <div>
              {contractData.c2 ? "J1 Timed Out" : "J2 Timed Out"}
              <div>
                <button
                  disabled={isTxDisabled}
                  onClick={() => {
                    handleTimeout();
                  }}
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
                  disabled={isTxDisabled}
                  onClick={() => {
                    handleReveal();
                  }}
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
                    disabled={isTxDisabled}
                    onClick={() => {
                      handlePlay();
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
