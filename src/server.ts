import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";
import express, { Request, Response } from "express";
import { analyzeTransaction } from "./utils/analyzeTx";
import { decodAddress } from "./utils/decodAddress";
import { decodeHexAmount } from "./utils/decodAmount";
import { getAmountInDollar } from "./utils/getAmountInDollar";
dotenv.config();

const provider = new ethers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
);

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

interface analyseResult {
  severity: string;
  detectedTests: {
    patternTest?: string;
    logSignTest?: string;
    txAmountsTest?: string;
  };
}

const BASE_ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

app.post(
  "/api/v1/detectAttack",
  async (req: Request, res: Response): Promise<any> => {
    const blockNumber = req.body.blockNumber;

    if (!blockNumber) {
      return res.status(400).json({
        error: "You forgot to send me the block number. Please start again",
      });
    }

    try {
      const block = await provider.getBlock(blockNumber, true);

      if (!block) {
        return res.status(404).json({ error: "Block not found." });
      }
      const detectedFlashLoans: any[] = [];
      let flashLoanDetected: false | analyseResult = false;

      const network = await provider.getNetwork();
      const chainId = network.chainId;
      let countAttack = 0;
      for (const tx of block.transactions) {
        const receipt = await provider.getTransactionReceipt(tx);

        if (!receipt) {
          continue;
        }

        flashLoanDetected = await analyzeTransaction(receipt);

        let decimals = 18;
        try {
          const contract = new ethers.Contract(
            receipt.logs[0].address,
            BASE_ERC20_ABI,
            provider
          );
          const scanDecimal = await contract.decimals();
          decimals = scanDecimal;
        } catch (err) {
          decimals = 18;
        }

        if (
          flashLoanDetected.severity !== "Low" &&
          receipt.logs[0].hasOwnProperty("data")
        ) {
          const amount = await decodeHexAmount(receipt.logs[0].data, decimals);
          const tokenPrice = await getAmountInDollar(receipt.logs[0].address);

          let amountInDollar = null;

          if (tokenPrice !== null) {
            amountInDollar = tokenPrice * parseFloat(amount);
          }

          const victimAddress = decodAddress(receipt.logs[0].topics[2]);

          if (victimAddress !== null) {
            countAttack++;
            detectedFlashLoans.push({
              attackId: countAttack,
              txHash: tx,
              flashLoanDetected,
              attackerAddress: decodAddress(receipt.logs[0].topics[1]),
              victimAddress: victimAddress,
              amountLostInToken: amount,
              amountLostInDollar: amountInDollar,
              chainId: `0x${chainId.toString()}`,
            });
          }
        }
      }

      if (detectedFlashLoans.length > 0) {
        res.status(200).json({
          message: "Potential flash loans detected in this block!",
          flashLoanDetected: true,
          flashLoans: detectedFlashLoans,
          chainId: `0x${chainId.toString()}`,
        });
      } else {
        res.status(200).json({
          flashLoanDetected: false,
          message: "No flash loan detected in this block.",
          chainId: `0x${chainId.toString()}`,
        });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Oups, an error occured, please retry later!" });
    }
  }
);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`API is listening on port ${PORT}`);
});
