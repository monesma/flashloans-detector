import { ethers } from "ethers";

export function detectByTxPattern(receipt: ethers.TransactionReceipt): boolean {
  const uniqueContracts = new Set(
    receipt.logs
      .map((log) => log.address.toLowerCase())
      .filter((address) => address !== ethers.ZeroAddress)
  );
  return uniqueContracts.size > 2;
}
