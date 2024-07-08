import {
  DutchOrder,
  DutchOrderBuilder,
  UnsignedV2DutchOrder,
} from '@uniswap/uniswapx-sdk';
import axios from 'axios';

import { Config, MAINNET_CHAINID } from './config';

enum OrderType {
  DUTCH_V1 = 'DUTCH_LIMIT',
  DUTCH_V2 = 'DUTCH_V2',
}

enum TradeType {
  EXACT_INPUT = 'exactIn',
  EXACT_OUTPUT = 'exactOut',
}

export type QuoteResponse = {
  readonly encodedOrder: string;
  readonly orderHash: string;
  readonly startTimeBufferSecs: number;
  readonly auctionPeriodSecs: number;
  readonly deadlineBufferSecs: number;
  readonly slippageTolerance: string;
  readonly quoteId: string;
};

export type QuoteRequestType = {
  readonly tokenInChainId: number;
  readonly tokenIn: string;
  readonly tokenOutChainId: number;
  readonly tokenOut: string;
  readonly amount: string;
  readonly type: string;
  readonly slippageTolerance?: string;
  readonly useUniswapX?: boolean;
  readonly configs: readonly {
    readonly routingType: OrderType;
    readonly swapper: string;
    readonly recipient?: string;
    readonly exclusivePeriodSecs?: number;
    readonly auctionPeriodSecs?: number;
    readonly useSyntheticQuotes?: boolean;
    readonly forceOpenOrders?: boolean;
  }[];
};

export type QuoteParams = {
  readonly swapper: string;
  readonly tokenIn: string;
  readonly tokenOut: string;
  readonly amount: string;
  readonly type: TradeType;
};

// returns encoded order
export async function quoteV1Order(
  params: QuoteParams,
  config: Config
): Promise<{ readonly order: DutchOrder; readonly quoteId: string }> {
  const payload = buildQuoteRequest(
    params,
    OrderType.DUTCH_V1,
    MAINNET_CHAINID
  );
  const responseData = await makeQuoteRequest(payload, config);
  const qid = responseData.quoteId;

  const order = DutchOrder.parse(responseData.encodedOrder, MAINNET_CHAINID);
  const builder = DutchOrderBuilder.fromOrder(order);
  const startTime =
    Math.floor(Date.now() / 1000) + responseData.startTimeBufferSecs;
  const endTime = startTime + responseData.auctionPeriodSecs;
  const deadline = endTime + responseData.deadlineBufferSecs;

  return {
    order: builder
      .decayStartTime(startTime)
      .decayEndTime(endTime)
      .deadline(deadline)
      .build(),
    quoteId: qid,
  };
}

// returns encoded order
export async function quoteV2Order(
  params: QuoteParams,
  config: Config,
  chainId: number = MAINNET_CHAINID,
  forceOpenOrders = false
): Promise<{ readonly order: UnsignedV2DutchOrder; readonly quoteId: string }> {
  const payload = buildQuoteRequest(
    params,
    OrderType.DUTCH_V2,
    chainId,
    forceOpenOrders
  );
  const responseData = await makeQuoteRequest(payload, config);
  const qid = responseData.quoteId;

  const order = UnsignedV2DutchOrder.parse(responseData.encodedOrder, chainId);

  return {
    order,
    quoteId: qid,
  };
}

function buildQuoteRequest(
  params: QuoteParams,
  orderType: OrderType,
  chainId: number,
  forceOpenOrders = false
): QuoteRequestType {
  return {
    tokenInChainId: chainId,
    tokenIn: params.tokenIn,
    tokenOutChainId: chainId,
    tokenOut: params.tokenOut,
    amount: params.amount,
    type:
      params.type === TradeType.EXACT_INPUT ? 'EXACT_INPUT' : 'EXACT_OUTPUT',
    configs: [
      {
        routingType: orderType,
        swapper: params.swapper,
        recipient: params.swapper,
        forceOpenOrders,
      },
    ],
  };
}

async function makeQuoteRequest(
  payload: QuoteRequestType,
  config: Config
): Promise<QuoteResponse> {
  const response = await axios.post(
    `${config.uniswapAPIUrl}/v2/quote`,
    payload,
    {
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
        referrer: 'https://app.uniswap.org/',
        origin: 'https://app.uniswap.org/',
      },
    }
  );
  if (!response.data) {
    console.error('No quote available');
    process.exit(1);
  }
  return response.data.quote;
}
