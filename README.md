# flashloans-detector
Technical test

Technologies: Node.js, Typescript, Ethers.js & Infura

Installation:

- download or clone repository
- open your terminal
- ```cd yourProjectUrl``` (you can drag n drop)
- install dépendencies: ```npm i```
- for compile typsecript: ```npx tsc```
- start with: ```npm run dev```

Your application will start on: ```http://localhost:{YOUR_PORT}```

# Description

Flash Loans detector is a system for detecting Flash Loans attacks on the blockchain, using three analysis methods: transaction models, cryptographic signatures and analysis of financial flows, with a dynamic scoring system to assess the severity of suspicious transactions.
Pdf is available for more explanation.

# Features

Construction of a virtual server and a REST API giving users access to an API route (POST) for sending data from a block for analysis.
The callback function of this API route is used to execute the heart of the programme in order to analyse, in a clear and precise order, the main functions of our structure, which are essential to our detector.

Construction of a virtual server and a REST API giving users access to an API route (POST) for sending data from a block for analysis.
The callback function of this API route is used to execute the heart of the programme in order to analyse, in a clear and precise order, the main functions of our structure, which are essential to our detector.
When the analysis is complete, its role is to filter only the most relevant data concerning the possibility of a hack and return the response to the user who called this route. This would enable a front-end application to trigger different types of alert.
This API route requires data input that respects this format:

```
{
		"blockNumber": 16818057
}
```
You can execute the call from POSTMAN or any AJAX request within your applications.

Localhost post route: ```http://localhost:{YOUR_PORT}/api/v1/detectAttack```

Response format:

```
{
    "message": "Potential flash loan(s) detected in this block!",
    "flashLoanDetected": true,
    "flashLoans": [
        {
            "attackId": 1,
            "txHash": "0xd66d082faaa425afcf3b072378566b8abda83fec5ebfc4f2fbd470d7a5ab9ffe",
            "contractAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            "flashLoanDetected": {
                "severity": "Critical",
                "detectedTests": {
                    "patternTest": "Multiple transactions detected",
                    "logSignTest": "Flash Loan detected",
                    "txAmountsTest": "High transfer amount detected"
                }
            },
            "attackerAddress": "0x35b5e5ad9019092c665357240f594e",
            "victimAddress": "0x32962b51589768828ad878876299e14",
            "amountLostInToken": "2077.872270211890788611",
            "amountLostInDollar": 6948903.560933413,
            "chainId": "0x1"
        },
	...others
    ],
    "chainId": "0x1",
    "unknownContractType": [
        {
            "attackId": 2,
            "txHash": "0xbbfcd425ce2a51571c2191c76c47b0e90d7fae3fade33155a12e138c77bf7f2f",
            "contractAddress": "0xF3dE3C0d654FDa23daD170f0f320a92172509127",
            "flashLoanDetected": "Not available",
            "msg": "This contract is not ERC20 and not ERC721",
            "attackerAddress": null,
            "victimAddress": null,
            "amountLostInToken": "Not available",
            "amountLostInDollar": "Not available",
            "suggest": "Analysing the smart contract code",
            "chainId": "0x1"
        },
	...others
    ]
}
```

## Main functions and operations

### analyzeTx

The role of this function is central to this application. It carries out each of the different analyses and filters and decides whether or not it considers the transaction to be potentially dangerous.

#### How it work

1 - Executes each of the three detectors asynchronously, which improves the performance of our queries indicating whether or not an anomaly has been detected (Boolean).

2 - Filters to count positive tests for risks

3 - Assigns the severity level of the risk factor according to the number of positive tests (Low, Medium, Hard, Critical).

4 - If one or more detectors are activated:

  - Adds the tests that have been activated to the response object.
  - Returns the severity and the positive tests (not all the tests, only those that have been activated)

### detectByTxPattern

Role of the function: analysis of transaction patterns
The function extracts the addresses of the contracts involved in the transaction from the event logs.

#### How it work

1 - Creation of a single list of contract addresses that have issued logs in the transaction, excluding the null address.
2 - If more than two unique contracts (three or more) are detected in the logs, this indicates that the transaction contains several interactions (often called sub-transactions) with different contracts. In this case, the function returns true as a promise, indicating a positive result.

### detectByLogSx

The function analyses a transaction receipt to detect Flash Loan hints based on known event signatures.

#### How it work

1 - Creation of a signature database of well-known FlashLoan contracts
2 - Checks whether a log matches one of the signatures
3 - Return positive or negative (boolean) as a promise

### detectByTxAmounts

The function analyses the transfer amounts in the transaction logs to detect suspicious transactions, such as Flash Loans, based on high thresholds.

#### How it work

1 - consultation of all logs
  - Extraction of the log amount if possible
    
2 - Return positive or negative (boolean) as a promise

## Utilities functions

### decodAddress

The function normalizes a hexadecimal address by checking and cleaning up its format

#### How it work

1 - Check that hexAddress is defined and not null

2 - Check that the address starts with ‘0x’
  - If yes, delete the leading zeros after ‘0x’
    
3 - Return formatted address or null

### decodeHexAmount

The function converts a raw hexadecimal value representing an amount into a readable format with a specified number of decimal places (default: 18).

#### How it work

1 - Checks if the string is empty or just ‘0x’
  - If is empty, return ‘0’
    
2 - Remove ‘0x’ prefix if present

3 - If string is empty after removing ‘0x return '0'

4 - Retrieves the last 64 characters, adding zeros if necessary

5 - Convert to BigInt

6 - Convert to readable format

### getAmountInDollar

The function uses CoinGecko's API to retrieve the price in dollars (USD) of a specific ERC-20 token, based on its contract address.

#### How it work

1 - Creation of an AJAX request (XMLHTTTPRequest) to the API giving access to information on ERC20 contract prices.
2 - Checks whether it obtains the price in usd and returns the price or 0


## Suggestions for improvement

1 - Adding temporal contexts: Recording the time at which the attack was detected could be useful for future analyses, particularly for trends over a given period.

2 - Improving the severity criteria would be useful to adjust the severity according to the exact amount of the Flash Loan or the number of indicators detected. For example, if an extremely high amount is detected but only one test has been triggered, the severity could be adjusted to reflect the seriousness of the situation.

3 - Apply a Real-time alerts for applications in production, it can be useful to send real-time alerts (for example, via a webhook or notification) if a certain severity threshold is reached.

4 - Add as many known signatures as possible as flash loans smart contract signatures to increase detection accuracy (perhaps there is a dataset).

5 - In this POC, I have analysed whether they are ERC20 or ERC721 smart contracts, which allows us to filter out a certain number of potential false positives.
We can see that some contracts don't comply with any of these standards, so it's difficult to identify whether they are flash-loans and so I've extracted them into a smart contract category for analysis.
