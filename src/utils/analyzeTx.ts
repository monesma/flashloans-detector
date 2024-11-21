import { ethers } from "ethers";
import { detectByTxPattern } from "./detectByTxPattern";
import { detectByTxAmounts } from "./detectByTxAmounts";
import { detectByLogSx } from "./detectByLogSx";

export async function analyzeTransaction(receipt: ethers.TransactionReceipt) {
  const patternTest: boolean = await detectByTxPattern(receipt);
  const logSignTest: boolean = await detectByLogSx(receipt);
  const txAmountsTest: boolean = await detectByTxAmounts(receipt);

  const count = [patternTest, logSignTest, txAmountsTest].filter(
    Boolean
  ).length;

  let severity = "Low";
  if (count === 1) severity = "Medium";
  else if (count === 2) severity = "High";
  else if (count === 3) severity = "Critical";

  if (count > 0) {
    const detectedTests: { [key: string]: string } = {};

    if (patternTest)
      detectedTests.patternTest = "Multiple transactions detected";
    if (logSignTest) detectedTests.logSignTest = "Flash Loan detected";
    if (txAmountsTest)
      detectedTests.txAmountsTest = "High transfer amount detected";

    return {
      severity,
      detectedTests,
    };
  }

  return {
    severity: "Low",
    detectedTests: {},
  };
}
