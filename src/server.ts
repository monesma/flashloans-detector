import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";
import express, { Request, Response } from "express";
import { analyzeTransaction } from "./utils/analyzeTx";
import { decodAddress } from "./utils/decodAddress";
import { decodeHexAmount } from "./utils/decodAmount";
import { getAmountInDollar } from "./utils/getAmountInDollar";
import {
  analyseResult,
  victimResult,
  unknownResult,
} from "./types/FlashLoans-types";
dotenv.config();

const provider = new ethers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
);

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const BASE_ERC20_ABI = [
  "function name() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];
const BASE_ERC721_ABI = [
  "function ownerOf(uint256) view returns (address)",
  "function tokenURI(uint256) view returns (string)",
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
      const [block, network] = await Promise.all([
        provider.getBlock(blockNumber, true),
        provider.getNetwork(),
      ]);

      if (!block) {
        return res.status(404).json({ error: "Block not found." });
      }

      const chainId = network.chainId;
      const detectedFlashLoans: victimResult[] = [];
      let flashLoanDetected: false | analyseResult = false;
      const unknownContractType: unknownResult[] = [];
      let countAttack = 0;
      let countUnknownContract = 0;

      const batchSize = 5;
      for (let i = 0; i < block.transactions.length; i += batchSize) {
        const batchTsx = block.transactions.slice(i, i + batchSize);
        const batchPromises = batchTsx.map(async (tx) => {
          const receipt = await provider.getTransactionReceipt(tx);

          if (!receipt) {
            return null;
          }

          if (!receipt.logs.length || !receipt.logs[0]) {
            return null;
          }

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
            try {
              const contract = new ethers.Contract(
                receipt.logs[0].address,
                BASE_ERC721_ABI,
                provider
              );
              await contract.ownerOf(1);
              return null;
            } catch {
              countUnknownContract++;
              const victimAddress = decodAddress(receipt.logs[0].topics[2]);
              const result = {
                attackId: countUnknownContract + 1,
                txHash: tx,
                contractAddress: receipt.logs[0].address,
                flashLoanDetected: "Not available",
                msg: "This contract is not ERC20 and not ERC721",
                attackerAddress: decodAddress(receipt.logs[0].topics[1]),
                victimAddress: victimAddress,
                amountLostInToken: "Not available",
                amountLostInDollar: "Not available",
                suggest: "Analysing the smart contract code",
                chainId: `0x${chainId.toString()}`,
              };
              unknownContractType.push(result);
              return null;
            }
          }
          const flashLoanDetected = await analyzeTransaction(receipt);
          if (
            flashLoanDetected.severity !== "Low" &&
            receipt.logs[0].hasOwnProperty("data")
          ) {
            const [amount, tokenPrice] = await Promise.all([
              decodeHexAmount(receipt.logs[0].data, decimals),
              getAmountInDollar(receipt.logs[0].address),
            ]);
            let amountInDollar = null;

            if (tokenPrice !== null) {
              amountInDollar = tokenPrice * parseFloat(amount);
            }

            const victimAddress = decodAddress(receipt.logs[0].topics[2]);

            if (victimAddress !== null) {
              const result = {
                attackId: countAttack + 1,
                txHash: tx,
                contractAddress: receipt.logs[0].address,
                flashLoanDetected,
                attackerAddress: decodAddress(receipt.logs[0].topics[1]),
                victimAddress: victimAddress,
                amountLostInToken: amount,
                amountLostInDollar:
                  amountInDollar === null ? "Not available" : amountInDollar,
                chainId: `0x${chainId.toString()}`,
              };
              return result;
            }
          }
          return null;
        });

        const batchResults = await Promise.all(batchPromises);

        const positiveAttacks = batchResults.filter(
          (result) => result !== null
        );

        for (const result of positiveAttacks) {
          countAttack++;
          if (result !== null) {
            result.attackId = countAttack;
            detectedFlashLoans.push(result);
          }
        }
      }

      if (detectedFlashLoans.length > 0) {
        res.status(200).json({
          message: "Potential flash loans detected in this block!",
          flashLoanDetected: true,
          potentialAttack: countAttack,
          unknownContract: countUnknownContract,
          flashLoans: detectedFlashLoans,
          chainId: `0x${chainId.toString()}`,
          unknownContractType: unknownContractType,
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
