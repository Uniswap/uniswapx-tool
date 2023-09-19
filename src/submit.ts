import axios from 'axios';

import { CHAIN_ID, Config } from './config';

export async function submitOrder(
  config: Config,
  encodedOrder: string,
  signature: string
) {
  const url = `${config.uniswapAPIUrl}/v2/order`;
  const payload = {
    encodedOrder,
    signature,
    chainId: CHAIN_ID,
  };
  try {
    const response = await axios.post(url, payload, {
      headers: {
        origin: 'https://app.uniswap.org',
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
      },
    });
    if (response.status !== 201) {
      throw new Error(`Order submission failed with ${response.status}`);
    }
    const { hash } = response.data;
    console.log(`Order submitted with hash ${hash}`);
    return hash;
  } catch (e) {
    console.log(e);
  }
}
