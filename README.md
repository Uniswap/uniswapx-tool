# uniswapx-tool

CLI tool for UniswapX

# Installation

```
yarn && yarn build && npm i -g .
uniswapx -h
```

# API Key

This tool uses the [Uniswap Trading API](https://api-docs.uniswap.org/api-reference/swapping/create_uniswapx_order). You need a free API key to use it.

Get your API key at: **https://developers.uniswap.org/**

Provide it via the `--api-key` flag or the `UNISWAP_API_KEY` environment variable:

```sh
export UNISWAP_API_KEY=<your-api-key>
# or pass it inline:
uniswapx --api-key <your-api-key> v2 quote ...
```

# Usage

# UniswapX V1

V1 order quoting is not supported by the Uniswap Trading API. Use `v1 build` to construct a V1 order manually.

## Build

Builds a UniswapX V1 order from params

```
> uniswapx v1 build -h
Usage: uniswapx build [options]

Build a UniswapX order

Options:
  --tokenIn <tokenIn>                                  Token In
  --tokenOut <tokenOut>                                Token Out
  --amountInStart <amountInStart>                      Amount In Start
  --amountInEnd <amountInEnd>                          Amount In End
  --amountOutStart <amountOutStart>                    Amount Out Start
  --amountOutEnd <amountOutEnd>                        Amount Out End
  --swapper <swapper>                                  Swapper
  --serialize                                          Return serialized order (default: false)
  --exclusive-filler [exclusiveFiller]                 Exclusive Filler
  --exclusivity-override-bps [exclusivityOverrideBps]  Exclusivity Override Bps
  -h, --help                                           display help for command

Global Options:
  -V, --version                                        output the version number
  --env <env>                                          Environment (choices: "beta", "prod", default: "prod")
  --api-key <apiKey>                                   Uniswap API key
```

## Submit

Submits a UniswapX order, signing it as well if private key given

Note: the address of the private key must:

- match the swapper address of the order
- have already approved the input token(s) to permit2

```
> uniswapx v1 submit -h
Usage: uniswapx submit [options] <serializedOrder>

Submit a UniswapX order

Arguments:
  serializedOrder             serialized order

Options:
  --signature [signature]               signature
  --private-key [privateKey]            private key
  --quote-id [quoteId] (optional)       add quote-id to order submission body
  --random-qid (optional)               add random quote-id to order submission body
  -h, --help                  display help for command

Global Options:
  -V, --version               output the version number
  --env <env>                 Environment (choices: "beta", "prod", default: "prod")
  --api-key <apiKey>          Uniswap API key
```

# UniswapX V2

## Quote

Create UniswapX V2 orders using live quotes

```sh
> uniswapx v2 quote -h
Usage: uniswapx v2 quote [options]

Quote a UniswapX V2 order

Options:
  --tokenIn <tokenIn>    Token In
  --tokenOut <tokenOut>  Token Out
  --amount <amount>      Amount In Start
  --swapper <swapper>    Swapper
  --type <type>          Trade Type (choices: "exactIn", "exactOut", default: "exactIn")
  --serialize            Return serialized order (default: false)
  --cosigner [cosigner]  Cosigner
  --chain-id <chainId>   ChainId
  -h, --help             display help for command

Global Options:
  -V, --version          output the version number
  --env <env>            Environment (choices: "beta", "prod", default: "prod")
  --api-key <apiKey>     Uniswap API key
```

```
❯ uniswapx v2 quote --tokenIn <tIn> --tokenOut <tOut> --amount <amount> --swapper <swapper>

{
  chainId: 1,
  permit2Address: ...,
  reactor: ...,
  swapper: ...,
  nonce: ...,
  deadline: ...,
  additionalValidationContract: ...,
  additionalValidationData: ...,
  input: {
    token: ...,
    startAmount: ...,
    endAmount: ...
  },
  outputs: [
    {
      token: ...,
      startAmount: ...,
      endAmount: ...,
      recipient: ...
    }
  ],
  cosigner: ...,
  quoteId: ...
}
```

## Submit

Submits a UniswapX V2 order, signing it as well if private key given

Note: the address of the private key must:

- match the swapper address of the order
- have already approved the input token(s) to permit2

```
> uniswapx v2 submit -h
Usage: uniswapx v2 submit [options] <serializedOrder>

Submit a UniswapX v2 order

Arguments:
  serializedOrder             serialized order

Options:
  --signature [signature]               signature
  --private-key [privateKey]            private key
  --quote-id [quoteId] (optional)       add quote-id to order submission body
  --random-qid (optional)               add random quote-id to order submission body
  --chain-id <chainId>                  ChainId (used for signing)
  -h, --help                  display help for command

Global Options:
  -V, --version               output the version number
  --env <env>                 Environment (choices: "beta", "prod", default: "prod")
  --api-key <apiKey>          Uniswap API key
```

## Simple order creation

Simple way to create, sign and submit an order all at once

```sh
uniswapx v2 quote --tokenIn <tokenIn> --tokenOut <tokenOut> --amount <amountIn> --swapper <swapper> --serialize | xargs uniswapx v2 submit --random-qid --private-key <privateKey>
```


# UniswapX V3

## Quote

Create UniswapX V3 orders using live quotes

```sh
> uniswapx v3 quote -h
Usage: uniswapx v3 quote [options]

Quote a UniswapX V3 order

Options:
  --tokenIn <tokenIn>    Token In
  --tokenOut <tokenOut>  Token Out
  --amount <amount>      Amount In Start
  --swapper <swapper>    Swapper
  --type <type>          Trade Type (choices: "exactIn", "exactOut", default: "exactIn")
  --serialize            Return serialized order (default: false)
  --cosigner [cosigner]  Cosigner
  --chain-id <chainId>   ChainId (default: 42161 Arbitrum)
  --slippageTolerance    Slippage Tolerance (e.g. "0.5" for 0.5%)
  -h, --help             display help for command

Global Options:
  -V, --version          output the version number
  --env <env>            Environment (choices: "beta", "prod", default: "prod")
  --api-key <apiKey>     Uniswap API key
```

```
❯ uniswapx v3 quote --tokenIn <tIn> --tokenOut <tOut> --amount <amount> --swapper <swapper>

{
  chainId: 42161,
  permit2Address: ...,
  reactor: ...,
  swapper: ...,
  nonce: ...,
  deadline: ...,
  additionalValidationContract: ...,
  additionalValidationData: ...,
  cosigner: ...,
  startingBaseFee: ...,
  input: {
    token: ...,
    startAmount: ...,
    curve: ...,
    maxAmount: ...,
    adjustmentPerGweiBaseFee: ...
  },
  outputs: [
    {
      token: ...,
      startAmount: ...,
      curve: ...,
      recipient: ...
      minAmount: ...,
      adjustmentPerGweiBaseFee: ...
    }
  ],
  cosigner: ...,
  quoteId: ...
}
```

## Submit

Submits a UniswapX V3 order, signing it as well if private key given

Note: the address of the private key must:

- match the swapper address of the order
- have already approved the input token(s) to permit2

```
> uniswapx v3 submit -h
Usage: uniswapx v3 submit [options] <serializedOrder>

Submit a UniswapX V3 order

Arguments:
  serializedOrder             serialized order

Options:
  --signature [signature]               signature
  --private-key [privateKey]            private key
  --quote-id [quoteId] (optional)       add quote-id to order submission body
  --random-qid (optional)               add random quote-id to order submission body
  --chain-id <chainId>                  ChainId (used for signing, default: 42161)
  -h, --help                  display help for command

Global Options:
  -V, --version               output the version number
  --env <env>                 Environment (choices: "beta", "prod", default: "prod")
  --api-key <apiKey>          Uniswap API key
```

## Simple order creation

Simple way to create, sign and submit an order all at once

```sh
uniswapx v3 quote --tokenIn <tokenIn> --tokenOut <tokenOut> --amount <amountIn> --swapper <swapper> --serialize | xargs uniswapx v3 submit --random-qid --private-key <privateKey>
```

# UniswapX Priority

## Quote

Create UniswapX priority orders using live quotes (Base chain)

```sh
> uniswapx priority quote -h
Usage: uniswapx priority quote [options]

Quote a UniswapX priority order

Options:
  --tokenIn <tokenIn>    Token In
  --tokenOut <tokenOut>  Token Out
  --amount <amount>      Amount In Start
  --swapper <swapper>    Swapper
  --type <type>          Trade Type (choices: "exactIn", "exactOut", default: "exactIn")
  --serialize            Return serialized order (default: false)
  --cosigner [cosigner]  Cosigner
  --chain-id <chainId>   ChainId (default: 8453 Base)
  -h, --help             display help for command

Global Options:
  -V, --version          output the version number
  --env <env>            Environment (choices: "beta", "prod", default: "prod")
  --api-key <apiKey>     Uniswap API key
```

```
❯ uniswapx priority quote --tokenIn <tIn> --tokenOut <tOut> --amount <amount> --swapper <swapper>

{
  chainId: 8453,
  permit2Address: ...,
  reactor: ...,
  swapper: ...,
  nonce: ...,
  deadline: ...,
  additionalValidationContract: ...,
  additionalValidationData: ...,
  cosigner: ...,
  auctionStartBlock: ...,
  baselinePriorityFeeWei: ...,
  input: {
    token: ...,
    amount: ...,
    mpsPerPriorityFeeWei: ...
  },
  outputs: [
    {
      token: ...,
      amount: ...,
      mpsPerPriorityFeeWei: ...,
      recipient: ...
    }
  ],
  quoteId: ...
}
```

## Submit

Submits a UniswapX priority order, signing it as well if private key given

Note: the address of the private key must:

- match the swapper address of the order
- have already approved the input token(s) to permit2

```
> uniswapx priority submit -h
Usage: uniswapx priority submit [options] <serializedOrder>

Submit a UniswapX priority order

Arguments:
  serializedOrder             serialized order

Options:
  --signature [signature]               signature
  --private-key [privateKey]            private key
  --quote-id [quoteId] (optional)       add quote-id to order submission body
  --random-qid (optional)               add random quote-id to order submission body
  --chain-id <chainId>                  ChainId (used for signing, default: 8453)
  -h, --help                  display help for command

Global Options:
  -V, --version               output the version number
  --env <env>                 Environment (choices: "beta", "prod", default: "prod")
  --api-key <apiKey>          Uniswap API key
```

## Simple order creation

Simple way to create, sign and submit an order all at once

```sh
uniswapx priority quote --tokenIn <tokenIn> --tokenOut <tokenOut> --amount <amountIn> --swapper <swapper> --serialize | xargs uniswapx priority submit --random-qid --private-key <privateKey>
```
