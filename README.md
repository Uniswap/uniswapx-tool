# uniswapx-tool

CLI tool for UniswapX

## Installation

```sh
yarn && yarn build && npm i -g .
uniswapx -h
```

## Configuration

Create a `.env` file in the project root:

```sh
UNISWAP_API_KEY=<your api key>
UNISWAP_PRIVATE_KEY=<your private key>  # optional, can also pass --private-key at runtime
```

`UNISWAP_API_KEY` is required for all requests. The API key can be generated from <https://developers.uniswap.org/>. `UNISWAP_PRIVATE_KEY` is only needed for submit commands that sign the order — it can be omitted from `.env` and passed via `--private-key` instead.

## Usage

## Order submission flow

UniswapX orders are submitted to the Trading API [`POST /v1/order`](https://developers.uniswap.org/docs/api-reference/post_order) endpoint. The request body is the quote response returned from `quote` plus the signed permit.

Because the full quote object must be submitted back verbatim, the `submit` commands take the JSON object printed by the matching `quote` command (not a serialized order). The typical flow is to capture the quote and pass it to submit:

```sh
QUOTE=$(uniswapx v2 quote --tokenIn <tIn> --tokenOut <tOut> --amount <amount> --swapper <swapper>)
uniswapx v2 submit "$QUOTE"
```

## UniswapX V2

### Quote

Create UniswapX V2 orders using live quotes

```sh
uniswapx v2 quote -h
Usage: uniswapx v2 quote [options]

Quote a UniswapX V2 order

Options:
  --tokenIn <tokenIn>        Token In
  --tokenOut <tokenOut>      Token Out
  --amount <amount>          Amount In Start
  --swapper <swapper>        Swapper
  --type <type>              Trade Type (choices: "exactIn", "exactOut", default: "exactIn")
  --serialize                Return serialized order (default: false)
  --cosigner [cosigner]      Cosigner
  -c, --chain-id [chainId]   chain id (default: "1")
  --openOrder                Force Open Order (default: false)
  -h, --help                 display help for command
```

```sh
uniswapx v2 quote --tokenIn <tIn> --tokenOut <tOut> --amount <amount> --swapper <swapper>

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

### Submit

Submits a UniswapX V2 order, signing it if a private key is available

Note: the private key address must:

- match the swapper address of the order
- have already approved the input token(s) to permit2

```sh
uniswapx v2 submit -h
Usage: uniswapx v2 submit [options] <quote>

Submit a UniswapX V2 order

Arguments:
  quote                        quote object JSON (as printed by `v2 quote`)

Options:
  --signature [signature]      signature
  --private-key [privateKey]   private key (overrides UNISWAP_PRIVATE_KEY env var)
  -c, --chain-id [chainId]     chain id (default: "1")
  -h, --help                   display help for command

Global Options:
  -V, --version                output the version number
  --env <env>                  Environment (choices: "beta", "prod", default: "beta")
```

### Simple order creation

Quote, sign, and submit in one command:

```sh
QUOTE=$(uniswapx v2 quote --tokenIn <tokenIn> --tokenOut <tokenOut> --amount <amountIn> --swapper <swapper>); uniswapx v2 submit "$QUOTE"
```

## UniswapX V3

### Quote

Create UniswapX V3 orders using live quotes

```sh
uniswapx v3 quote -h
Usage: uniswapx v3 quote [options]

Quote a UniswapX V3 order

Options:
  --tokenIn <tokenIn>                          Token In
  --tokenOut <tokenOut>                        Token Out
  --amount <amount>                            Amount In Start
  --swapper <swapper>                          Swapper
  --type <type>                                Trade Type (choices: "exactIn", "exactOut", default: "exactIn")
  --serialize                                  Return serialized order (default: false)
  --cosigner [cosigner]                        Cosigner
  -c, --chain-id [chainId]                     chain id (default: "42161")
  --openOrder                                  Force Open Order (default: true)
  --deadlineBufferSecs [deadlineBufferSecs]    Deadline Buffer Seconds
  --slippageTolerance [slippageTolerance]      Slippage Tolerance
  -h, --help                                   display help for command
```

```sh
uniswapx v3 quote --tokenIn <tIn> --tokenOut <tOut> --amount <amount> --swapper <swapper>

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
      recipient: ...,
      minAmount: ...,
      adjustmentPerGweiBaseFee: ...
    }
  ],
  quoteId: ...
}
```

### Submit

Submits a UniswapX V3 order, signing it if a private key is available

Note: the private key address must:

- match the swapper address of the order
- have already approved the input token(s) to permit2

```sh
uniswapx v3 submit -h
Usage: uniswapx v3 submit [options] <quote>

Submit a UniswapX V3 order

Arguments:
  quote                        quote object JSON (as printed by `v3 quote`)

Options:
  --signature [signature]      signature
  --private-key [privateKey]   private key (overrides UNISWAP_PRIVATE_KEY env var)
  -c, --chain-id [chainId]     chain id (default: "42161")
  -h, --help                   display help for command

Global Options:
  -V, --version                output the version number
  --env <env>                  Environment (choices: "beta", "prod", default: "beta")
```

### Simple order creation

Quote, sign, and submit in one command:

```sh
QUOTE=$(uniswapx v3 quote --tokenIn <tokenIn> --tokenOut <tokenOut> --amount <amountIn> --swapper <swapper>); uniswapx v3 submit "$QUOTE"
```

## UniswapX Priority

### Quote

Create UniswapX priority orders using live quotes

```sh
uniswapx priority quote -h
Usage: uniswapx priority quote [options]

Quote a UniswapX priority order

Options:
  --tokenIn <tokenIn>                        Token In
  --tokenOut <tokenOut>                      Token Out
  --amount <amount>                          Amount In Start
  --swapper <swapper>                        Swapper
  --type <type>                              Trade Type (choices: "exactIn", "exactOut", default: "exactIn")
  --serialize                                Return serialized order (default: false)
  --cosigner [cosigner]                      Cosigner
  -c, --chain-id [chainId]                   chain id (default: "8453")
  --slippageTolerance [slippageTolerance]    Slippage Tolerance
  -h, --help                                 display help for command
```

```sh
uniswapx priority quote --tokenIn <tIn> --tokenOut <tOut> --amount <amount> --swapper <swapper>

{
  chainId: 1,
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

### Submit

Submits a UniswapX priority order, signing it if a private key is available

Note: the private key address must:

- match the swapper address of the order
- have already approved the input token(s) to permit2

```sh
uniswapx priority submit -h
Usage: uniswapx priority submit [options] <quote>

Submit a UniswapX priority order

Arguments:
  quote                        quote object JSON (as printed by `priority quote`)

Options:
  --signature [signature]      signature
  --private-key [privateKey]   private key (overrides UNISWAP_PRIVATE_KEY env var)
  -c, --chain-id [chainId]     chain id (default: "1")
  -h, --help                   display help for command

Global Options:
  -V, --version                output the version number
  --env <env>                  Environment (choices: "beta", "prod", default: "beta")
```

### Simple order creation

Quote, sign, and submit in one command:

```sh
QUOTE=$(uniswapx priority quote --tokenIn <tokenIn> --tokenOut <tokenOut> --amount <amountIn> --swapper <swapper>); uniswapx priority submit "$QUOTE"
```
