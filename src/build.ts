import { BigNumber } from 'ethers'
import { DutchOrderBuilder, Order } from '@uniswap/uniswapx-sdk';

import { CHAIN_ID } from './config';

export type OrderParams = {
  readonly swapper: string;
  readonly tokenIn: string;
  readonly tokenOut: string;
  readonly amountInStart: string;
  readonly amountInEnd: string;
  readonly amountOutStart: string;
  readonly amountOutEnd: string;
  readonly nonce?: number;
  readonly deadline?: number;
  readonly decayStartTime?: number;
  readonly decayEndTime?: number;
  readonly exclusiveFiller?: string;
  readonly exclusivityOverrideBps?: string;
};

const DEFAULT_OVERRIDE_BPS = 100;

// returns encoded order
export function buildOrder(params: OrderParams): Order {
  const builder = new DutchOrderBuilder(CHAIN_ID).input({
    token: params.tokenIn,
    startAmount: BigNumber.from(params.amountInStart),
    endAmount: BigNumber.from(params.amountInEnd),
  })
  .output({
    token: params.tokenOut,
    startAmount: BigNumber.from(params.amountOutStart),
    endAmount: BigNumber.from(params.amountOutEnd),
    recipient: params.swapper,
  })
  .swapper(params.swapper)
  if (params.exclusiveFiller) {
    const override = params.exclusivityOverrideBps ?? DEFAULT_OVERRIDE_BPS;
    builder.exclusiveFiller(params.exclusiveFiller, BigNumber.from(override))
  }
  if (params.decayStartTime) {
    builder.decayStartTime(params.decayStartTime);
  } else {
    // 30s from now
    builder.decayStartTime(Math.floor(Date.now() / 1000) + 30);
  }

  if (params.decayEndTime) {
    builder.decayEndTime(params.decayEndTime);
  } else {
    // 2 mins from now
    builder.decayEndTime(Math.floor(Date.now() / 1000) + 120);
  }

  if (params.deadline) {
    builder.deadline(params.deadline);
  }

  if (params.nonce) {
    builder.nonce(BigNumber.from(params.nonce));
  } else {
    builder.nonce(BigNumber.from(Math.floor(Math.random() * 1000000000)));
  }
  return builder.build();
}
