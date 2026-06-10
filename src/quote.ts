import {
  DutchOrder,
  DutchOrderBuilder,
  UnsignedPriorityOrder,
  UnsignedV2DutchOrder,
  UnsignedV3DutchOrder,
} from '@uniswap/uniswapx-sdk';
import axios from 'axios';

import { ChainId, Config } from './config';

enum OrderType {
  DUTCH_V1 = 'DUTCH_LIMIT',
  DUTCH_V2 = 'DUTCH_V2',
  DUTCH_V3 = 'DUTCH_V3',
  PRIORITY = 'PRIORITY',
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

export type DutchQuoteRequestConfigType = {
  readonly routingType: OrderType;
  readonly swapper: string;
  readonly recipient?: string;
  readonly startTimeBufferSecs?: number;
  readonly exclusivePeriodSecs?: number;
  readonly auctionPeriodSecs?: number;
  readonly useSyntheticQuotes?: boolean;
};

export type DutchV2V3QuoteRequestConfigType = DutchQuoteRequestConfigType & {
  readonly forceOpenOrders?: boolean;
  readonly useSyntheticQuotes?: boolean;
  readonly deadlineBufferSecs?: number;
};

export type PriorityQuoteRequestConfigType = {
  readonly routingType: OrderType;
  readonly swapper: string;
  readonly recipient?: string;
  readonly startTimeBufferSecs?: number;
  readonly mpsPerPriorityFeeWei?: number;
  readonly baselinePriorityFeeWei?: number;
};

export type QuoteRequestConfigType =
  | DutchQuoteRequestConfigType
  | DutchV2V3QuoteRequestConfigType
  | PriorityQuoteRequestConfigType;

export type QuoteRequestType = {
  readonly tokenInChainId: number;
  readonly tokenIn: string;
  readonly tokenOutChainId: number;
  readonly tokenOut: string;
  readonly amount: string;
  readonly swapper: string;
  readonly type: string;
  readonly slippageTolerance?: string;
  readonly useUniswapX?: boolean;
  // Legacy unified-routing-api shape; the trading API ignores it.
  readonly configs?: QuoteRequestConfigType[];
  // Trading API (trade-api.gateway.uniswap.org) protocol selection.
  readonly protocols?: string[];
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
  config: Config,
  overrides?: Partial<DutchQuoteRequestConfigType>
): Promise<{ readonly order: DutchOrder; readonly quoteId: string }> {
  const payload = buildQuoteRequest(
    params,
    OrderType.DUTCH_V1,
    ChainId.Mainnet,
    overrides
  );
  const responseData = await makeQuoteRequest(payload, config);
  const qid = responseData.quoteId;

  const order = DutchOrder.parse(responseData.encodedOrder, ChainId.Mainnet);
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
  chainId: number = ChainId.Mainnet,
  overrides: Partial<DutchV2V3QuoteRequestConfigType> = {
    forceOpenOrders: false,
  }
): Promise<{ readonly order: UnsignedV2DutchOrder; readonly quoteId: string }> {
  const payload = buildQuoteRequest(
    params,
    OrderType.DUTCH_V2,
    chainId,
    overrides
  );
  const responseData = await makeQuoteRequest(payload, config);
  const qid = responseData.quoteId;

  const order = UnsignedV2DutchOrder.parse(responseData.encodedOrder, chainId);

  return {
    order,
    quoteId: qid,
  };
}

// returns encoded order
export async function quoteV3Order(
  params: QuoteParams,
  config: Config,
  chainId: number = ChainId.Arbitrum,
  overrides: Partial<DutchV2V3QuoteRequestConfigType> = {
    forceOpenOrders: true,
    useSyntheticQuotes: true,
  },
  slippageTolerance?: string
): Promise<{ readonly order: UnsignedV3DutchOrder; readonly quoteId: string }> {
  const payload = buildQuoteRequest(
    params,
    OrderType.DUTCH_V3,
    chainId,
    overrides,
    slippageTolerance
  );
  const responseData = await makeQuoteRequest(payload, config);
  const qid = responseData.quoteId;

  const order = UnsignedV3DutchOrder.parse(responseData.encodedOrder, chainId);

  return {
    order,
    quoteId: qid,
  };
}

export async function quotePriorityOrder(
  params: QuoteParams,
  config: Config,
  chainId: number = ChainId.Base,
  overrides?: Partial<PriorityQuoteRequestConfigType>,
  slippageTolerance?: string
): Promise<{
  readonly order: UnsignedPriorityOrder;
  readonly quoteId: string;
}> {
  const payload = buildQuoteRequest(
    params,
    OrderType.PRIORITY,
    chainId,
    overrides,
    slippageTolerance
  );
  const responseData = await makeQuoteRequest(payload, config);
  const qid = responseData.quoteId;

  const order = UnsignedPriorityOrder.parse(responseData.encodedOrder, chainId);

  return {
    order,
    quoteId: qid,
  };
}

function buildQuoteRequest(
  params: QuoteParams,
  orderType: OrderType,
  chainId: number,
  overrides?: Partial<QuoteRequestConfigType>,
  slippageTolerance?: string
): QuoteRequestType {
  const base = {
    tokenInChainId: chainId,
    tokenIn: params.tokenIn,
    tokenOutChainId: chainId,
    tokenOut: params.tokenOut,
    amount: params.amount,
    swapper: params.swapper,
    slippageTolerance: slippageTolerance ?? undefined,
    type:
      params.type === TradeType.EXACT_INPUT ? 'EXACT_INPUT' : 'EXACT_OUTPUT',
  };

  // The trading API (trade-api.gateway.uniswap.org) selects UniswapX via the
  // top-level `protocols` array — the legacy unified-routing-api `configs`
  // shape is not understood and silently falls back to CLASSIC routing.
  if (orderType === OrderType.DUTCH_V3) {
    return {
      ...base,
      protocols: ['UNISWAPX_V3'],
    };
  }

  return {
    ...base,
    configs: [
      {
        routingType: orderType,
        swapper: params.swapper,
        recipient: params.swapper,
        ...overrides,
      },
    ],
  };
}

async function makeQuoteRequest(
  payload: QuoteRequestType,
  config: Config
): Promise<QuoteResponse> {
  try {
    const response = await axios.post(
      `${config.uniswapAPIUrl}/v1/quote`,
      payload,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          'content-type': 'application/json',
          referer: 'https://app.uniswap.org/',
          origin: 'https://app.uniswap.org/',
          ...(config.apiKey && { 'x-api-key': config.apiKey }),
          ...(config.isBeta && { 'x-beta-rfq': 'true' }),
        },
      }
    );
    if (!response.data) {
      console.error('No quote available');
      process.exit(0);
    }
    const expectedRouting = payload.protocols?.includes('UNISWAPX_V3')
      ? OrderType.DUTCH_V3
      : payload.configs?.[0]?.routingType;
    if (response.data.routing !== expectedRouting) {
      console.error(
        `Expected ${expectedRouting} quote but received ${response.data.routing}.`
      );
      process.exit(0);
    }
    return response.data.quote;
  } catch (error) {
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers sent:', error.config?.headers);
      console.error(
        'Response body:',
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error(error.message);
    }
    process.exit(0);
  }
}
