import { formatEther, isAddress, isAddressEqual } from "viem";
export const commitValidation= (radio:number,balance:any,stake:string|null,target:string|null,address:string|null)=>{

  if (!balance) {
    alert("Cannot Fetch your balance");
    return;
  }
    if (!radio) {
        alert("Please select a move");
        return false;
      }
      if (!stake || stake === "0") {
        alert("Please Enter a stake amount");
        return false;
      }
      if (parseFloat(formatEther(balance.value)) < parseFloat(stake)) {
        alert("Your stake amount is higher than your balance");
        return false;
      }
      if (!target) {
        alert("Please enter a target player to invite");
        return false;
      }
      if (!isAddress(target)) {
        alert("Target is not a valid ethereum address");
        return false;
      }
      if (isAddressEqual(target as `0x${string}`, address as `0x${string}`)) {
        alert("Target and creator are same");
        return false;
      }
      return true;
  
}