import axios from "axios";
export async function getAmountInDollar(tokenAddress: string) {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum`,
      { params: { contract_addresses: tokenAddress, vs_currencies: "usd" } }
    );
    return response.data[tokenAddress.toLowerCase()]?.usd || 0;
  } catch (error) {
    return null;
  }
}
