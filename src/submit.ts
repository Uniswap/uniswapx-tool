import axios from 'axios';

import { ChainId, Config } from './config';
import { logVerboseRequest, logVerboseResponse } from './log';
import { OrderType } from '@uniswap/uniswapx-sdk';

function authHeaders(config: Config): Record<string, string> {
  return {
    ...(config.apiKey && { 'x-api-key': config.apiKey }),
    ...(config.isBeta && { 'x-beta-rfq': 'true' }),
  };
}

function submitHeaders(config: Config): Record<string, string> {
  return {
    origin: 'https://app.uniswap.org',
    accept: 'application/json, text/plain, */*',
    'content-type': 'application/json',
    ...authHeaders(config),
  };
}

export async function submitV1Order(
  config: Config,
  encodedOrder: string,
  signature: string,
  quoteId?: string
) {
  const url = `${config.submitApiUrl}/v2/limit-order`;
  const payload = {
    encodedOrder,
    signature,
    chainId: ChainId.Mainnet,
    quoteId: quoteId,
  };
  const headers = submitHeaders(config);
  logVerboseRequest(config.verbose, url, headers, payload);
  try {
    const response = await axios.post(url, payload, { headers });
    logVerboseResponse(config.verbose, response.status, response.data);
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
  const url = `${config.submitApiUrl}/v2/rfq`;
  const payload = {
    encodedInnerOrder,
    innerSig,
    tokenInChainId: chainId,
    tokenOutChainId: chainId,
    quoteId: quoteId,
    requestId: quoteId,
    allowNoQuote: true,
  };
  const headers = submitHeaders(config);
  logVerboseRequest(config.verbose, url, headers, payload);
  try {
    const response = await axios.post(url, payload, { headers });
    logVerboseResponse(config.verbose, response.status, response.data);
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
  const url = `${config.submitApiUrl}/v2/rfq`;
  const payload = {
    encodedInnerOrder,
    innerSig,
    tokenInChainId: chainId,
    tokenOutChainId: chainId,
    quoteId: quoteId,
    requestId: quoteId,
    allowNoQuote: true,
    forceOpenOrder: true,
  };
  const headers = submitHeaders(config);
  logVerboseRequest(config.verbose, url, headers, payload);
  try {
    const response = await axios.post(url, payload, { headers });
    logVerboseResponse(config.verbose, response.status, response.data);
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
  const url = `${config.submitApiUrl}/v2/order`;
  const payload = {
    encodedOrder,
    signature,
    chainId,
    quoteId: quoteId,
    orderType: OrderType.Priority,
  };
  const headers = submitHeaders(config);
  logVerboseRequest(config.verbose, url, headers, payload);
  try {
    const response = await axios.post(url, payload, { headers });
    logVerboseResponse(config.verbose, response.status, response.data);
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
