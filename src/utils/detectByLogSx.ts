import { ethers } from "ethers";

export function detectByLogSx(receipt: ethers.TransactionReceipt): boolean {
  const flashLoanEventSignatures = [
    ethers.id("FlashLoan(address,uint256,uint256,address[])"),
    ethers.id("Flash_loan(address,uint256,uint256,address[])"),
    ethers.id("Borrow(address,uint256)"),
    ethers.id("Loan(address,uint256)"),
    ethers.id("Liquidation(address,uint256)"),
    "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67",
  ];

  const matchFound = receipt.logs.some((log) =>
    flashLoanEventSignatures.some(
      (signatureHash) => log.topics[0] === signatureHash
    )
  );

  return matchFound;
}
