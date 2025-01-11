import { parseEther } from "viem";
import { useBalance } from "wagmi";

export const commitValidation = (
  radio: number,
  stake: string,
  target: string | null,
  address: string
) => {
  if (radio === 0) {
    alert("No option Selected");
    return false;
  }

  if (!stake) {
    alert("No stake amount entered");
    return false;
  }

  if (!target) {
    alert("No target address entered");
    return false;
  }

  if (target.toLowerCase() === address.toLowerCase()) {
    alert("Cannot play against yourself");
    return false;
  }

  if (target.length !== 42 || !target.startsWith("0x")) {
    alert("Invalid target address");
    return false;
  }

  try {
    parseEther(stake);
  } catch (error) {
    alert("Invalid stake amount");
    return false;
  }

  return true;
};