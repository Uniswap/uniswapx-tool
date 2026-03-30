import axios from 'axios';

import { Config } from './config';

async function postOrder(
  config: Config,
  signature: string,
  quote: Record<string, unknown>,
  routing: string
): Promise<string | undefined> {
  const url = `${config.uniswapAPIUrl}/order`;
  const payload = { signature, quote, routing };
  try {
    const response = await axios.post(url, payload, {
      headers: {
        'x-api-key': config.apiKey,
        'content-type': 'application/json',
      },
    });
    if (response.status !== 201) {
      throw new Error(`Order submission failed with status ${response.status}`);
    }
    const { orderId, orderHash } = response.data as {
      readonly orderId?: string;
      readonly orderHash?: string;
    };
    const id = orderId ?? orderHash;
    console.log(`Order submitted: ${id}`);
    return id;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      console.error(
        `Submission error (${e.response.status}): ${JSON.stringify(
          e.response.data
        )}`
      );
      if (e.response.status === 401) {
        console.error(
          'Unauthorized: check your API key. Get one at https://developers.uniswap.org/'
        );
      }
    } else if (e instanceof Error) {
      console.error(e.message);
    } else {
      console.error(String(e));
    }
    process.exit(1);
  }
}

function buildQuote(
  encodedOrder: string,
  quoteId?: string
): Record<string, unknown> {
  return quoteId ? { encodedOrder, quoteId } : { encodedOrder };
}

export async function submitV1Order(
  config: Config,
  encodedOrder: string,
  signature: string,
  quoteId?: string
) {
  return postOrder(
    config,
    signature,
    buildQuote(encodedOrder, quoteId),
    'LIMIT_ORDER'
  );
}

export async function submitV2Order(
  config: Config,
  encodedOrder: string,
  signature: string,
  quoteId?: string
) {
  return postOrder(
    config,
    signature,
    buildQuote(encodedOrder, quoteId),
    'DUTCH_V2'
  );
}

export async function submitV3Order(
  config: Config,
  encodedOrder: string,
  signature: string,
  quoteId?: string
) {
  return postOrder(
    config,
    signature,
    buildQuote(encodedOrder, quoteId),
    'DUTCH_V3'
  );
}

export async function submitPriorityOrder(
  config: Config,
  encodedOrder: string,
  signature: string,
  quoteId?: string
) {
  return postOrder(
    config,
    signature,
    buildQuote(encodedOrder, quoteId),
    'PRIORITY'
  );
}
