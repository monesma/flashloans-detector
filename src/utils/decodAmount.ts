import { ethers } from "ethers";

function decodeHexAmount(hexAmount: string, decimals: number = 18): string {
  try {
    if (!hexAmount || hexAmount === "0x") {
      return "0";
    }
    const cleanHex = hexAmount.startsWith("0x")
      ? hexAmount.slice(2)
      : hexAmount;

    if (!cleanHex) {
      return "0";
    }

    const lastChars = cleanHex.padStart(64, "0").slice(-64);

    const bigIntAmount = BigInt(`0x${lastChars}`);

    return ethers.formatUnits(bigIntAmount, decimals);
  } catch (error) {
    return "0";
  }
}

export { decodeHexAmount };
