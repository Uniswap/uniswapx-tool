const BETA_UNISWAP_API_URL = 'https://beta.api.uniswap.org';
const PROD_UNISWAP_API_URL = 'https://api.uniswap.org';

export enum ChainId {
  Mainnet = 1,
  Arbitrum = 42161,
  Base = 8453,
}

export type Config = {
  readonly uniswapAPIUrl: string;
};

export enum Env {
  Beta = 'beta',
  Prod = 'prod',
}

export function getConfig(env: Env): Config {
  switch (env) {
    case Env.Beta:
      return {
        uniswapAPIUrl: BETA_UNISWAP_API_URL,
      };
    case Env.Prod:
      return {
        uniswapAPIUrl: PROD_UNISWAP_API_URL,
      };
    default:
      throw new Error(`Unknown env: ${env}`);
  }
}
