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

export type DutchV2QuoteRequestConfigType = DutchQuoteRequestConfigType & {
  readonly forceOpenOrders?: boolean;
};

export type PriorityQuoteRequestConfigType = {
  readonly routingType: OrderType;
  readonly swapper: string;
  readonly recipient?: string;
  readonly startTimeBufferSecs?: number;
  readonly mpsPerPriorityFeeWei?: number;
  readonly baselinePriorityFeeWei?: number;
}

export type QuoteRequestConfigType = DutchQuoteRequestConfigType | DutchV2QuoteRequestConfigType | PriorityQuoteRequestConfigType;

export type QuoteRequestType = {
  readonly tokenInChainId: number;
  readonly tokenIn: string;
  readonly tokenOutChainId: number;
  readonly tokenOut: string;
  readonly amount: string;
  readonly type: string;
  readonly slippageTolerance?: string;
  readonly useUniswapX?: boolean;
  readonly configs: QuoteRequestConfigType[];
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
  overrides: Partial<DutchV2QuoteRequestConfigType> = {
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
  overrides: Partial<DutchV2QuoteRequestConfigType> = {
    forceOpenOrders: true,
  }
): Promise<{ readonly order: UnsignedV3DutchOrder; readonly quoteId: string }> {
  const payload = buildQuoteRequest(
    params,
    OrderType.DUTCH_V3,
    chainId,
    overrides
  );
  const responseData = await makeQuoteRequest(payload, config);
  const qid = responseData.quoteId;

  const order = UnsignedV3DutchOrder.parse(responseData.encodedOrder, chainId);

  return {
    order,
    quoteId: qid,
  };
} export async function quotePriorityOrder(
  params: QuoteParams,
  config: Config,
  chainId: number = ChainId.Base,
  overrides?: Partial<PriorityQuoteRequestConfigType>
): Promise<{ readonly order: UnsignedPriorityOrder; readonly quoteId: string }> {
  const payload = buildQuoteRequest(
    params,
    OrderType.PRIORITY,
    chainId,
    overrides
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
  overrides?: Partial<QuoteRequestConfigType>
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
        ...overrides
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
