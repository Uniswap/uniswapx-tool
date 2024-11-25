# uniswapx-tool

CLI tool for UniswapX

# Installation

```
> yarn
> yarn build
> npm i -g .
> uniswapx -h
```

# Usage

# UniswapX V1

## Quote

Create UniswapX orders using live quotes

```sh
> uniswapx v1 quote -h
Usage: uniswapx quote [options]

Quote a UniswapX order

Options:
  --tokenIn <tokenIn>                                  Token In
  --tokenOut <tokenOut>                                Token Out
  --amount <amount>                                    Amount In Start
  --swapper <swapper>                                  Swapper
  --type <type>                                        Trade Type (choices: "exactIn", "exactOut", default: "exactIn")
  --serialize                                          Return serialized order (default: false)
  --exclusive-filler [exclusiveFiller]                 Exclusive Filler
  --exclusivity-override-bps [exclusivityOverrideBps]  Exclusivity Override Bps
  -h, --help                                           display help for command

Global Options:
  -V, --version                                        output the version number
  --env <env>                                          Environment (choices: "beta", "prod", default: "beta")
```

```
❯ uniswapx v1 quote --tokenIn <tIn> --tokenOut <tOut> --amount <amount> --swapper <swapper> --exclusive-filler <filler>

{
  chainId: 1,
  permit2Address: ..,
  reactor: ...,
  swapper: ...,
  nonce: ...,
  deadline: ...,
  additionalValidationContract: ...,
  additionalValidationData: ...,
  decayStartTime: ...,
  decayEndTime: ...,
  exclusiveFiller: ...,
  exclusivityOverrideBps: '100',
  input: {
    token: ...,
    startAmount: ...,
    endAmount: ...,
  },
  outputs: [{ ... }],
  quoteId: <uuid v4>
}
```

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
  --env <env>                                          Environment (choices: "beta", "prod", default: "beta")
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
  --env <env>                 Environment (choices: "beta", "prod", default: "beta")
```

## Simple order creation

Simple way to create, sign and submit an order all at once

```sh
uniswapx v1 quote --tokenIn <tokenIn> --tokenOut <tokenOut> --amount <amountIn> --swapper <swapper> --exclusive-filler <exclusiveFiller> --serialize | xargs uniswapx v1 submit --random-qid --private-key <privateKey>
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
```

```
❯ uniswapx v2 quote --tokenIn <tIn> --tokenOut <tOut> --amount <amount> --swapper <swapper> --exclusive-filler <filler>

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
  -h, --help                  display help for command

Global Options:
  -V, --version               output the version number
  --env <env>                 Environment (choices: "beta", "prod", default: "beta")
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
  --chain-id <chainId>   ChainId
  -h, --help             display help for command
```

```
❯ uniswapx v3 quote --tokenIn <tIn> --tokenOut <tOut> --amount <amount> --swapper <swapper> --exclusive-filler <filler>

{
  chainId: 42161,
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

Submits a UniswapX V3 order, signing it as well if private key given

Note: the address of the private key must:

- match the swapper address of the order
- have already approved the input token(s) to permit2

```
> uniswapx V3 submit -h
Usage: uniswapx V3 submit [options] <serializedOrder>

Submit a UniswapX V3 order

Arguments:
  serializedOrder             serialized order

Options:
  --signature [signature]               signature
  --private-key [privateKey]            private key
  --quote-id [quoteId] (optional)       add quote-id to order submission body
  --random-qid (optional)               add random quote-id to order submission body
  --chain-id <chainId>                  ChainId
  -h, --help                  display help for command

Global Options:
  -V, --version               output the version number
  --env <env>                 Environment (choices: "beta", "prod", default: "beta")
```

## Simple order creation

Simple way to create, sign and submit an order all at once

```sh
uniswapx V3 quote --tokenIn <tokenIn> --tokenOut <tokenOut> --amount <amountIn> --swapper <swapper> --serialize | xargs uniswapx V3 submit --random-qid --private-key <privateKey>
```

