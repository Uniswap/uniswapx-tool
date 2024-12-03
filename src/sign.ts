import {
  DutchOrder,
  UniswapXOrder,
  UnsignedPriorityOrder,
  UnsignedV2DutchOrder,
  UnsignedV3DutchOrder,
} from '@uniswap/uniswapx-sdk';
import { Wallet } from 'ethers';
import { ChainId } from './config';

export async function signV1Order(
  encodedOrder: string,
  wallet: Wallet
): Promise<{
  readonly serializedOrder: string;
  readonly hash: string;
  readonly signature: string;
}> {
  const order = DutchOrder.parse(encodedOrder, ChainId.Mainnet);
  const signature = await signOrder(order, wallet);
  const serializedOrder = order.serialize();
  const hash = order.hash();
  return { serializedOrder, hash, signature };
}

export async function signV2Order(
  encodedOrder: string,
  wallet: Wallet,
  chainId: number
): Promise<{
  readonly serializedOrder: string;
  readonly hash: string;
  readonly signature: string;
}> {
  const order = UnsignedV2DutchOrder.parse(encodedOrder, chainId);
  const signature = await signOrder(order, wallet);
  const serializedOrder = order.serialize();
  const hash = order.hash();
  return { serializedOrder, hash, signature };
}

export async function signV3Order(
  encodedOrder: string,
  wallet: Wallet,
  chainId: number
): Promise<{
  readonly serializedOrder: string;
  readonly hash: string;
  readonly signature: string;
}> {
  const order = UnsignedV3DutchOrder.parse(encodedOrder, chainId);
  const signature = await signOrder(order, wallet);
  const serializedOrder = order.serialize();
  const hash = order.hash();
  return { serializedOrder, hash, signature };
}

export async function signPriorityOrder(
  encodedOrder: string,
  wallet: Wallet,
  chainId: number
): Promise<{
  readonly serializedOrder: string;
  readonly hash: string;
  readonly signature: string;
}> {
  const order = UnsignedPriorityOrder.parse(encodedOrder, chainId);
  const signature = await signOrder(order, wallet);
  const serializedOrder = order.serialize();
  const hash = order.hash();
  return { serializedOrder, hash, signature };
}

async function signOrder(
  order: UniswapXOrder,
  wallet: Wallet
): Promise<string> {
  if (
    order.info.swapper.toLowerCase() != wallet.address.toLowerCase() ||
    order.info.outputs.some(
      (output) => output.recipient.toLowerCase() != wallet.address.toLowerCase()
    )
  ) {
    throw new Error(
      `Swapper address ${order.info.swapper} does not match wallet address ${wallet.address} or wallet is not recipient of outputs.`
    );
  }

  const { domain, types, values } = order.permitData();
  return await wallet._signTypedData(domain, types, values);
}
