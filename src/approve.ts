import { PERMIT2_MAPPING } from '@uniswap/uniswapx-sdk';
import { BigNumber, Contract, providers, Wallet } from 'ethers';

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function symbol() view returns (string)',
];

// Public keyless RPC endpoints for every chain with a UniswapX reactor
// deployment (per the SDK's REACTOR_ADDRESS_MAPPING).
const DEFAULT_RPC_URLS: Record<number, string> = {
  1: 'https://ethereum-rpc.publicnode.com', // Mainnet
  10: 'https://mainnet.optimism.io', // Optimism
  56: 'https://bsc-dataseed.binance.org', // BNB Chain
  130: 'https://mainnet.unichain.org', // Unichain
  137: 'https://polygon-bor-rpc.publicnode.com', // Polygon
  143: 'https://rpc.monad.xyz', // Monad
  196: 'https://rpc.xlayer.tech', // X Layer
  480: 'https://worldchain-mainnet.g.alchemy.com/public', // World Chain
  1868: 'https://rpc.soneium.org', // Soneium
  4217: 'https://rpc.tempo.xyz', // Tempo
  8453: 'https://mainnet.base.org', // Base
  42161: 'https://arb1.arbitrum.io/rpc', // Arbitrum
  42220: 'https://forno.celo.org', // Celo
  43114: 'https://api.avax.network/ext/bc/C/rpc', // Avalanche
  81457: 'https://rpc.blast.io', // Blast
  7777777: 'https://rpc.zora.energy', // Zora
  1301: 'https://sepolia.unichain.org', // Unichain Sepolia
  11155111: 'https://ethereum-sepolia-rpc.publicnode.com', // Sepolia
};

// UniswapX reactors never hold ERC20 allowances directly; the swapper approves
// Permit2 once and reactors pull funds through it via the per-order signed
// permit. So "approve the reactor" means approving Permit2 for the token.
export function permit2Address(chainId: number): string {
  const permit2 = (PERMIT2_MAPPING as Record<number, string>)[chainId];
  if (!permit2) {
    throw new Error(`No known Permit2 deployment for chain ${chainId}`);
  }
  return permit2;
}

export function getRpcUrl(chainId: number, override?: string): string {
  const url = override ?? process.env.RPC_URL ?? DEFAULT_RPC_URLS[chainId];
  if (!url) {
    throw new Error(
      `No default RPC URL for chain ${chainId}; pass --rpc-url or set RPC_URL`
    );
  }
  return url;
}

export async function approveToken(params: {
  readonly privateKey: string;
  readonly token: string;
  readonly spender: string;
  readonly amount: BigNumber;
  readonly chainId: number;
  readonly rpcUrl: string;
}): Promise<void> {
  const provider = new providers.StaticJsonRpcProvider(
    params.rpcUrl,
    params.chainId
  );
  const wallet = new Wallet(params.privateKey, provider);
  const token = new Contract(params.token, ERC20_ABI, wallet);

  let symbol = params.token;
  try {
    symbol = await token.symbol();
  } catch {
    // non-standard token; fall back to the address
  }

  const current: BigNumber = await token.allowance(
    wallet.address,
    params.spender
  );
  console.log(
    `Current ${symbol} allowance from ${wallet.address} to ${params.spender}: ${current}`
  );
  if (current.gte(params.amount)) {
    console.log('Allowance already sufficient; nothing to do');
    return;
  }

  const tx = await token.approve(params.spender, params.amount);
  console.log(`Approval sent: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(
    `Approval confirmed in block ${receipt.blockNumber} (status ${receipt.status})`
  );
}
