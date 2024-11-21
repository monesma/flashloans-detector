import { ethers } from "ethers";

export function detectByTxAmounts(receipt: ethers.TransactionReceipt): boolean {
  return receipt.logs.some((log) => {
    try {
      const amount = ethers.toBigInt(log.data);
      return amount > ethers.parseEther("100000");
    } catch {
      return false;
    }
  });
}
