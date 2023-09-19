import { DutchOrder } from '@uniswap/uniswapx-sdk';
import axios from 'axios';

import { CHAIN_ID, Config } from './config';

enum TradeType {
  EXACT_INPUT = 'exactIn',
  EXACT_OUTPUT = 'exactOut',
}

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
    readonly routingType: 'DUTCH_LIMIT';
    readonly swapper: string;
    readonly recipient?: string;
    readonly exclusivePeriodSecs?: number;
    readonly auctionPeriodSecs?: number;
    readonly useSyntheticQuotes?: boolean;
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
export async function quoteOrder(
  params: QuoteParams,
  config: Config
): Promise<DutchOrder> {
  const payload: QuoteRequestType = {
    tokenInChainId: CHAIN_ID,
    tokenIn: params.tokenIn,
    tokenOutChainId: CHAIN_ID,
    tokenOut: params.tokenOut,
    amount: params.amount,
    type:
      params.type === TradeType.EXACT_INPUT ? 'EXACT_INPUT' : 'EXACT_OUTPUT',
    configs: [
      {
        routingType: 'DUTCH_LIMIT',
        swapper: params.swapper,
        recipient: params.swapper,
      },
    ],
  };
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

  return DutchOrder.parse(response.data.quote.encodedOrder, CHAIN_ID);
}
