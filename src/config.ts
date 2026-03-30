const BETA_UNISWAP_TRADING_API_URL = 'https://beta.trade-api.gateway.uniswap.org/v1';
const PROD_UNISWAP_TRADING_API_URL = 'https://trade-api.gateway.uniswap.org/v1';

export enum ChainId {
  Mainnet = 1,
  Arbitrum = 42161,
  Base = 8453,
  Unichain = 130,
}

export type Config = {
  readonly uniswapAPIUrl: string;
  readonly apiKey: string;
};

export enum Env {
  Beta = 'beta',
  Prod = 'prod',
}

export function getConfig(env: Env, apiKey: string): Config {
  switch (env) {
    case Env.Beta:
      return {
        uniswapAPIUrl: BETA_UNISWAP_TRADING_API_URL,
        apiKey,
      };
    case Env.Prod:
      return {
        uniswapAPIUrl: PROD_UNISWAP_TRADING_API_URL,
        apiKey,
      };
    default:
      throw new Error(`Unknown env: ${env}`);
  }
}
