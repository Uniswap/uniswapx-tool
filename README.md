# uniswapx-tool

CLI tool for UniswapX

# Usage

## Quote
Create UniswapX orders using live quotes

```sh
> uniswapx quote -h
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

## Build
Builds a UniswapX order from params

```
> uniswapx build -h
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
> uniswapx submit -h
Usage: uniswapx submit [options] <serializedOrder>

Submit a UniswapX order

Arguments:
  serializedOrder             serialized order

Options:
  --signature [signature]     signature
  --private-key [privateKey]  private key
  -h, --help                  display help for command

Global Options:
  -V, --version               output the version number
  --env <env>                 Environment (choices: "beta", "prod", default: "beta")
```

## Simple order creation
Simple way to create, sign and submit an order all at once

```sh
uniswapx quote --tokenIn <tokenIn> --tokenOut <tokenOut> --amount <amountIn> --swapper <swapper> --exclusive-filler <exclusiveFiller> --serialize | xargs uniswapx submit --private-key <privateKey>
```
