import { ethers } from "ethers";
import { detectByTxPattern } from "./detectByTxPattern";
import { detectByTxAmounts } from "./detectByTxAmounts";
import { detectByLogSx } from "./detectByLogSx";

export async function analyzeTransaction(
  receipt: ethers.TransactionReceipt
): Promise<{ severity: string; detectedTests: Record<string, string> }> {
  const [patternTest, logSignTest, txAmountsTest] = await Promise.all([
    detectByTxPattern(receipt),
    detectByLogSx(receipt),
    detectByTxAmounts(receipt),
  ]);

  const tests = {
    patternTest: "Multiple transactions detected",
    logSignTest: "Flash Loan detected",
    txAmountsTest: "High transfer amount detected",
  };

  const detectedTests: { [key: string]: string } = {};

  let count = 0;

  if (patternTest) {
    detectedTests.patternTest = tests.patternTest;
    count++;
  }

  if (logSignTest) {
    detectedTests.logSignTest = tests.logSignTest;
    count++;
  }

  if (txAmountsTest) {
    detectedTests.txAmountsTest = tests.txAmountsTest;
    count++;
  }

  const severity =
    count === 0
      ? "Low"
      : count === 1
      ? "Medium"
      : count === 2
      ? "High"
      : "Critical";

  return { severity, detectedTests };
}
