import { ethers } from "ethers";

export function detectByTxAmounts(receipt: ethers.TransactionReceipt): Promise<boolean> {
  
  return new Promise(resolve => {
    receipt.logs.some((log) => {
      try {
        const amount = ethers.toBigInt(log.data)
        resolve(amount > ethers.parseEther("100000"))
      } catch {
        resolve(false)
      }
    });
  })
}
