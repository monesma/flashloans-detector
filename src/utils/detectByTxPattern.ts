import { ethers } from "ethers";

export function detectByTxPattern(receipt: ethers.TransactionReceipt): Promise<boolean> {
  return new Promise(resolve => {
    const uniqueContracts = new Set(
      receipt.logs
        .map(log => log.address.toLowerCase())
        .filter(address => address !== ethers.ZeroAddress)
    )
    resolve(uniqueContracts.size > 2)
  })
}
