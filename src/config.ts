const BETA_UNISWAP_API_URL = 'https://beta.api.uniswap.org';
const PROD_UNISWAP_API_URL = 'https://trade-api.gateway.uniswap.org';
const PROD_SUBMIT_API_URL = 'https://api.uniswap.org';

export enum ChainId {
  Mainnet = 1,
  Arbitrum = 42161,
  Base = 8453,
  Unichain = 130,
}

export type Config = {
  readonly uniswapAPIUrl: string;
  readonly submitApiUrl: string;
  readonly apiKey?: string;
  readonly isBeta: boolean;
};

export enum Env {
  Beta = 'beta',
  Prod = 'prod',
}

export function getConfig(env: Env): Config {
  const apiKey = process.env.UNISWAP_API_KEY;
  if (apiKey === undefined || apiKey.trim() === '') {
    throw new Error('UNISWAP_API_KEY is not set');
  }
  switch (env) {
    case Env.Beta:
      return {
        uniswapAPIUrl: BETA_UNISWAP_API_URL,
        submitApiUrl: BETA_UNISWAP_API_URL,
        apiKey,
        isBeta: true,
      };
    case Env.Prod:
      return {
        uniswapAPIUrl: PROD_UNISWAP_API_URL,
        submitApiUrl: PROD_SUBMIT_API_URL,
        apiKey,
        isBeta: false,
      };
    default:
      throw new Error(`Unknown env: ${env}`);
  }
}
