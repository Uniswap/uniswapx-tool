import {
  DutchOrder,
  DutchOrderBuilder,
  UnsignedPriorityOrder,
  UnsignedV2DutchOrder,
  UnsignedV3DutchOrder,
} from '@uniswap/uniswapx-sdk';
import axios from 'axios';

import { ChainId, Config } from './config';

enum Protocol {
  UNISWAPX_V2 = 'UNISWAPX_V2',
  UNISWAPX_V3 = 'UNISWAPX_V3',
}

enum TradeType {
  EXACT_INPUT = 'exactIn',
  EXACT_OUTPUT = 'exactOut',
}

export type QuoteResponse = {
  readonly encodedOrder: string;
  readonly orderId?: string;
  readonly quoteId?: string;
  // V1 legacy fields
  readonly startTimeBufferSecs?: number;
  readonly auctionPeriodSecs?: number;
  readonly deadlineBufferSecs?: number;
};

type QuoteRequestType = {
  readonly type: string;
  readonly amount: string;
  readonly tokenInChainId: number;
  readonly tokenOutChainId: number;
  readonly tokenIn: string;
  readonly tokenOut: string;
  readonly swapper: string;
  readonly slippageTolerance?: string;
  readonly autoSlippage?: string;
  readonly routingPreference: string;
  readonly protocols: readonly string[];
};

export type QuoteParams = {
  readonly swapper: string;
  readonly tokenIn: string;
  readonly tokenOut: string;
  readonly amount: string;
  readonly type: TradeType;
};

export async function quoteV1Order(
  params: QuoteParams,
  config: Config
): Promise<{ readonly order: DutchOrder; readonly quoteId: string }> {
  // V1 (DUTCH_LIMIT) quoting is not supported by the Uniswap Trading API.
  // Use `v1 build` to manually construct a V1 order.
  console.error(
    'V1 order quoting is not supported by the Uniswap Trading API. Use `uniswapx v1 build` to construct a V1 order manually.'
  );
  process.exit(1);
  const payload = buildQuoteRequest(
    params,
    Protocol.UNISWAPX_V2,
    ChainId.Mainnet
  );
  const { quote: responseData } = await makeQuoteRequest(payload, config);
  const qid = responseData.quoteId ?? '';

  const order = DutchOrder.parse(responseData.encodedOrder, ChainId.Mainnet);
  const builder = DutchOrderBuilder.fromOrder(order);
  const startTimeBufferSecs = responseData.startTimeBufferSecs ?? 0;
  const auctionPeriodSecs = responseData.auctionPeriodSecs ?? 120;
  const deadlineBufferSecs = responseData.deadlineBufferSecs ?? 60;
  const startTime = Math.floor(Date.now() / 1000) + startTimeBufferSecs;
  const endTime = startTime + auctionPeriodSecs;
  const deadline = endTime + deadlineBufferSecs;

  return {
    order: builder
      .decayStartTime(startTime)
      .decayEndTime(endTime)
      .deadline(deadline)
      .build(),
    quoteId: qid,
  };
}

export async function quoteV2Order(
  params: QuoteParams,
  config: Config,
  chainId: number = ChainId.Mainnet
): Promise<{ readonly order: UnsignedV2DutchOrder; readonly quoteId: string }> {
  const payload = buildQuoteRequest(params, Protocol.UNISWAPX_V2, chainId);
  const { quote: responseData } = await makeQuoteRequest(payload, config);
  const qid = responseData.quoteId ?? '';
  const order = UnsignedV2DutchOrder.parse(responseData.encodedOrder, chainId);
  return { order, quoteId: qid };
}

export async function quoteV3Order(
  params: QuoteParams,
  config: Config,
  chainId: number = ChainId.Arbitrum,
  slippageTolerance?: string
): Promise<{ readonly order: UnsignedV3DutchOrder; readonly quoteId: string }> {
  const payload = buildQuoteRequest(
    params,
    Protocol.UNISWAPX_V3,
    chainId,
    slippageTolerance
  );
  const { quote: responseData } = await makeQuoteRequest(payload, config);
  const qid = responseData.quoteId ?? '';
  const order = UnsignedV3DutchOrder.parse(responseData.encodedOrder, chainId);
  return { order, quoteId: qid };
}

export async function quotePriorityOrder(
  params: QuoteParams,
  config: Config,
  chainId: number = ChainId.Base,
  slippageTolerance?: string
): Promise<{
  readonly order: UnsignedPriorityOrder;
  readonly quoteId: string;
}> {
  // Priority orders are returned when requesting UNISWAPX_V2 on supported chains (e.g. Base)
  const payload = buildQuoteRequest(
    params,
    Protocol.UNISWAPX_V2,
    chainId,
    slippageTolerance
  );
  const { quote: responseData } = await makeQuoteRequest(payload, config);
  const qid = responseData.quoteId ?? '';
  const order = UnsignedPriorityOrder.parse(responseData.encodedOrder, chainId);
  return { order, quoteId: qid };
}

function buildQuoteRequest(
  params: QuoteParams,
  protocol: Protocol,
  chainId: number,
  slippageTolerance?: string
): QuoteRequestType {
  return {
    type:
      params.type === TradeType.EXACT_INPUT ? 'EXACT_INPUT' : 'EXACT_OUTPUT',
    amount: params.amount,
    tokenInChainId: chainId,
    tokenOutChainId: chainId,
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    swapper: params.swapper,
    ...(slippageTolerance
      ? { slippageTolerance }
      : { autoSlippage: 'DEFAULT' }),
    routingPreference: 'BEST_PRICE',
    protocols: [protocol],
  };
}

async function makeQuoteRequest(
  payload: QuoteRequestType,
  config: Config
): Promise<{ readonly quote: QuoteResponse; readonly routing: string }> {
  try {
    const response = await axios.post(
      `${config.uniswapAPIUrl}/quote`,
      payload,
      {
        headers: {
          'x-api-key': config.apiKey,
          'content-type': 'application/json',
        },
      }
    );
    if (!response.data || !response.data.quote) {
      console.error('No quote available');
      process.exit(1);
    }
    return {
      quote: response.data.quote as QuoteResponse,
      routing: response.data.routing as string,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        `Quote request failed (${error.response.status}): ${JSON.stringify(
          error.response.data
        )}`
      );
      if (error.response.status === 401) {
        console.error(
          'Unauthorized: check your API key. Get one at https://developers.uniswap.org/'
        );
      }
    } else {
      console.error(error instanceof Error ? error.message : String(error));
    }
    process.exit(1);
  }
}
