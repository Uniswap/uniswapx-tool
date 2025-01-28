import axios from 'axios';

import { ChainId, Config } from './config';
import { OrderType } from '@uniswap/uniswapx-sdk';

export async function submitV1Order(
  config: Config,
  encodedOrder: string,
  signature: string,
  quoteId?: string
) {
  const url = `${config.uniswapAPIUrl}/v2/order`;
  const payload = {
    encodedOrder,
    signature,
    chainId: ChainId.Mainnet,
    quoteId: quoteId,
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

export async function submitV2Order(
  config: Config,
  encodedInnerOrder: string,
  innerSig: string,
  chainId: number,
  quoteId?: string
) {
  const url = `${config.uniswapAPIUrl}/v2/rfq`;
  const payload = {
    encodedInnerOrder,
    innerSig,
    tokenInChainId: chainId,
    tokenOutChainId: chainId,
    quoteId: quoteId,
    requestId: quoteId,
    allowNoQuote: true,
  };
  try {
    const response = await axios.post(url, payload, {
      headers: {
        origin: 'https://app.uniswap.org',
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
      },
    });
    if (response.status !== 200) {
      throw new Error(`Order submission failed with ${response.status}`);
    }
    const { orderHash, requestId } = response.data;
    console.log(
      `Order submitted with hash ${orderHash}, requestId ${requestId}`
    );
    return orderHash;
  } catch (e) {
    console.log(e);
  }
}

export async function submitV3Order(
  config: Config,
  encodedInnerOrder: string,
  innerSig: string,
  chainId: number,
  quoteId?: string
) {
  const url = `${config.uniswapAPIUrl}/v2/rfq`;
  const payload = {
    encodedInnerOrder,
    innerSig,
    tokenInChainId: chainId,
    tokenOutChainId: chainId,
    quoteId: quoteId,
    requestId: quoteId,
    allowNoQuote: true,
    forceOpenOrder: true
  };
  try {
    const response = await axios.post(url, payload, {
      headers: {
        origin: 'https://app.uniswap.org',
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
      },
    });
    if (response.status !== 200) {
      throw new Error(`Order submission failed with ${response.status}`);
    }
    const { orderHash, requestId } = response.data;
    console.log(
      `Order submitted with hash ${orderHash}, requestId ${requestId}`
    );
    return orderHash;
  } catch (e) {
    console.log(e);
  }
}

export async function submitPriorityOrder(
  config: Config,
  encodedOrder: string,
  signature: string,
  chainId: number = ChainId.Base,
  quoteId?: string
) {
  console.log('submitPriorityOrder', encodedOrder, signature, chainId, quoteId);
  const url = `${config.uniswapAPIUrl}/v2/order`;
  const payload = {
    encodedOrder,
    signature,
    chainId,
    quoteId: quoteId,
    orderType: OrderType.Priority,
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
