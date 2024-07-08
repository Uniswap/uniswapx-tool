import { DutchOrder, DutchOrderBuilder } from '@uniswap/uniswapx-sdk';
import { BigNumber } from 'ethers';

import { MAINNET_CHAINID } from './config';

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
  readonly addFeeOutput?: boolean;
};

const DEFAULT_OVERRIDE_BPS = 100;
const DEFAULT_FEES_BPS = 15;
const BPS = 10_000;

// returns encoded order
export function buildOrder(params: OrderParams): DutchOrder {
  let feeAmountStart = BigNumber.from(0);
  let feeAmountEnd = BigNumber.from(0);
  if (params.addFeeOutput) {
    feeAmountStart = BigNumber.from(params.amountOutStart)
      .mul(DEFAULT_FEES_BPS)
      .div(BPS);
    feeAmountEnd = BigNumber.from(params.amountOutEnd)
      .mul(DEFAULT_FEES_BPS)
      .div(BPS);
  }

  const builder = new DutchOrderBuilder(MAINNET_CHAINID)
    .input({
      token: params.tokenIn,
      startAmount: BigNumber.from(params.amountInStart),
      endAmount: BigNumber.from(params.amountInEnd),
    })
    .output({
      token: params.tokenOut,
      // Fees are subtractive not additive
      startAmount: BigNumber.from(params.amountOutStart).sub(feeAmountStart),
      endAmount: BigNumber.from(params.amountOutEnd).sub(feeAmountEnd),
      recipient: params.swapper,
    })
    .swapper(params.swapper);

  if (params.addFeeOutput) {
    builder.output({
      token: params.tokenOut,
      startAmount: feeAmountStart,
      endAmount: feeAmountEnd,
      // Since this is used for testing only
      // we just send the extra output back to the swapper
      recipient: params.swapper,
    });
  }

  if (params.exclusiveFiller) {
    const override = params.exclusivityOverrideBps ?? DEFAULT_OVERRIDE_BPS;
    builder.exclusiveFiller(params.exclusiveFiller, BigNumber.from(override));
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
