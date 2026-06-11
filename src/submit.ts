import axios from 'axios';

import { Config } from './config';
import { logVerboseRequest, logVerboseResponse } from './log';

function authHeaders(config: Config): Record<string, string> {
  return {
    ...(config.apiKey && { 'x-api-key': config.apiKey }),
    ...(config.isBeta && { 'x-beta-rfq': 'true' }),
  };
}

// Submits a gasless order to the Trading API.
// https://developers.uniswap.org/docs/api-reference/post_order
//
// The order request is identical to the quote response (the `routing` and
// `quote` fields returned from `/v1/quote`) plus the signed permit. The full
// quote object must be passed back verbatim — it is not reconstructable from
// the encoded order alone.
export async function submitOrder(
  config: Config,
  quote: unknown,
  signature: string,
  routing: string
) {
  const url = `${config.submitApiUrl}/v1/order`;
  const payload = {
    signature,
    quote,
    routing,
  };
  const headers = {
    accept: 'application/json, text/plain, */*',
    'content-type': 'application/json',
    ...authHeaders(config),
  };
  logVerboseRequest(config.verbose, 'POST', url, headers, payload);
  try {
    const response = await axios.post(url, payload, { headers });
    logVerboseResponse(config.verbose, response.status, response.data);
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Order submission failed with ${response.status}`);
    }
    const { orderId, requestId, orderStatus } = response.data;
    console.log(
      `Order submitted: orderId ${orderId}, requestId ${requestId}, status ${orderStatus}`
    );
    return orderId;
  } catch (e) {
    console.log(e);
  }
}
