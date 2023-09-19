import { DutchOrder } from '@uniswap/uniswapx-sdk';
import { Wallet } from 'ethers';

export async function signOrder(
  encodedOrder: string,
  wallet: Wallet
): Promise<{
  readonly serializedOrder: string;
  readonly hash: string;
  readonly signature: string;
}> {
  const order = DutchOrder.parse(encodedOrder, 1);

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

  // Sign the built order
  const { domain, types, values } = order.permitData();
  const signature = await wallet._signTypedData(domain, types, values);
  const serializedOrder = order.serialize();
  const hash = order.hash();
  return { serializedOrder, hash, signature };
}
