import {
  CosignedV3DutchOrder,
  UnsignedPriorityOrder,
  UnsignedV2DutchOrder,
} from '@uniswap/uniswapx-sdk';
import axios from 'axios';

import { permit2Address } from './approve';
import { ChainId, Config } from './config';
import { logVerboseRequest, logVerboseResponse } from './log';

enum OrderType {
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
  readonly orderInfo?: Record<string, unknown>;
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
  readonly configs?: readonly QuoteRequestConfigType[];
  // Trading API (trade-api.gateway.uniswap.org) protocol selection.
  readonly protocols?: readonly string[];
  // UniswapX option flags sent at the top level in the trading-API shape
  // (nested in configs in the legacy shape).
  readonly useSyntheticQuotes?: boolean;
  readonly forceOpenOrders?: boolean;
  readonly deadlineBufferSecs?: number;
};

export type QuoteParams = {
  readonly swapper: string;
  readonly tokenIn: string;
  readonly tokenOut: string;
  readonly amount: string;
  readonly type: TradeType;
};

// returns encoded order
export async function quoteV2Order(
  params: QuoteParams,
  config: Config,
  chainId: number = ChainId.Mainnet,
  overrides: Partial<DutchV2V3QuoteRequestConfigType> = {}
): Promise<{
  readonly order: UnsignedV2DutchOrder;
  readonly quoteId: string;
  readonly quote: QuoteResponse;
}> {
  const payload = buildQuoteRequest(
    params,
    OrderType.DUTCH_V2,
    chainId,
    overrides
  );
  const responseData = await makeQuoteRequest(payload, config);
  const qid = responseData.quoteId;

  const order = UnsignedV2DutchOrder.parse(responseData.encodedOrder, chainId, permit2Address(chainId));

  return {
    order,
    quoteId: qid,
    // The raw quote object must be submitted back verbatim to `/v1/order`.
    quote: responseData,
  };
}

// returns encoded order
export async function quoteV3Order(
  params: QuoteParams,
  config: Config,
  chainId: number = ChainId.Arbitrum,
  overrides: Partial<DutchV2V3QuoteRequestConfigType> = {},
  slippageTolerance?: string
): Promise<{
  readonly order: CosignedV3DutchOrder;
  readonly quoteId: string;
  readonly quote: QuoteResponse;
}> {
  const payload = buildQuoteRequest(
    params,
    OrderType.DUTCH_V3,
    chainId,
    overrides,
    slippageTolerance
  );
  const responseData = await makeQuoteRequest(payload, config);
  const qid = responseData.quoteId;

  const order = CosignedV3DutchOrder.parse(responseData.encodedOrder, chainId, permit2Address(chainId));

  return {
    order,
    quoteId: qid,
    // The raw quote object must be submitted back verbatim to `/v1/order`.
    quote: responseData,
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
  readonly quote: QuoteResponse;
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

  const order = UnsignedPriorityOrder.parse(responseData.encodedOrder, chainId, permit2Address(chainId));

  return {
    order,
    quoteId: qid,
    // The raw quote object must be submitted back verbatim to `/v1/order`.
    quote: responseData,
  };
}

// Trading API (trade-api.gateway.uniswap.org) protocol names for the order
// types it serves via the top-level `protocols` array, keyed by the routing
// value it returns.
const ORDER_TYPE_TO_PROTOCOL: Partial<Record<OrderType, string>> = {
  [OrderType.DUTCH_V2]: 'UNISWAPX_V2',
  [OrderType.DUTCH_V3]: 'UNISWAPX_V3',
};

const PROTOCOL_TO_ORDER_TYPE: Record<string, OrderType> = Object.fromEntries(
  Object.entries(ORDER_TYPE_TO_PROTOCOL).map(([orderType, protocol]) => [
    protocol,
    orderType as OrderType,
  ])
);

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
  const protocol = ORDER_TYPE_TO_PROTOCOL[orderType];
  if (protocol !== undefined) {
    const dutchOverrides = (overrides ??
      {}) as Partial<DutchV2V3QuoteRequestConfigType>;
    return {
      ...base,
      protocols: [protocol],
      ...(dutchOverrides.useSyntheticQuotes !== undefined && {
        useSyntheticQuotes: dutchOverrides.useSyntheticQuotes,
      }),
      ...(dutchOverrides.forceOpenOrders !== undefined && {
        forceOpenOrders: dutchOverrides.forceOpenOrders,
      }),
      ...(dutchOverrides.deadlineBufferSecs !== undefined && {
        deadlineBufferSecs: dutchOverrides.deadlineBufferSecs,
      }),
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
  const url = `${config.uniswapAPIUrl}/v1/quote`;
  const headers = {
    accept: 'application/json, text/plain, */*',
    'content-type': 'application/json',
    referer: 'https://app.uniswap.org/',
    origin: 'https://app.uniswap.org/',
    ...(config.apiKey && { 'x-api-key': config.apiKey }),
    ...(config.isBeta && { 'x-beta-rfq': 'true' }),
  };
  logVerboseRequest(config.verbose, 'POST', url, headers, payload);
  try {
    const response = await axios.post(url, payload, { headers });
    logVerboseResponse(config.verbose, response.status, response.data);
    if (!response.data) {
      console.error('No quote available');
      process.exit(0);
    }
    const requestedProtocol = payload.protocols?.find(
      (protocol) => PROTOCOL_TO_ORDER_TYPE[protocol] !== undefined
    );
    const expectedRouting = requestedProtocol
      ? PROTOCOL_TO_ORDER_TYPE[requestedProtocol]
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
