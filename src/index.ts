import 'dotenv/config';
import {
  UnsignedPriorityOrder,
  UnsignedV2DutchOrder,
  UnsignedV3DutchOrder,
} from '@uniswap/uniswapx-sdk';
import { Command, Option, program } from 'commander';
import { BigNumber, constants, Wallet } from 'ethers';

import { approveToken, getRpcUrl, permit2Address } from './approve';
import { ChainId, getConfig } from './config';
import { quotePriorityOrder, quoteV2Order, quoteV3Order } from './quote';
import { signPriorityOrder, signV2Order, signV3Order } from './sign';
import { submitOrder } from './submit';

function setupProgram() {
  program.configureHelp({
    showGlobalOptions: true,
  });

  program
    .version('1.0.0')
    .description('Tool for UniswapX')
    .addOption(
      new Option('--env <env>', 'Environment')
        .choices(['beta', 'prod'])
        .default('prod')
    )
    .option(
      '-v, --verbose',
      'Print request headers, request body, and response',
      false
    );

  setupUniswapXV2();
  setupUniswapXV3();
  setupPriority();
  setupApprove();
}

function setupApprove() {
  program
    .command('approve')
    .description(
      'Approve a token to Permit2 so UniswapX reactors can pull funds (defaults to infinite allowance)'
    )
    .requiredOption('--token <token>', 'Token to approve')
    .option(
      '--spender [spender]',
      'Spender address (defaults to Permit2 for the chain)'
    )
    .option(
      '--amount [amount]',
      'Allowance amount in wei (defaults to infinite)'
    )
    .option('--private-key [privateKey]', 'private key')
    .option(
      '--rpc-url [rpcUrl]',
      'RPC URL (defaults per chain, or RPC_URL env var)'
    )
    .option('-c, --chain-id [chainId]', 'chain id', ChainId.Mainnet.toString())
    .action(async (options) => {
      const privateKey = options.privateKey ?? process.env.UNISWAP_PRIVATE_KEY;
      if (!privateKey) {
        console.error(
          'Private key is required (pass --private-key or set UNISWAP_PRIVATE_KEY)'
        );
        process.exit(1);
      }
      const chainId = parseInt(options.chainId, 10);
      await approveToken({
        privateKey,
        token: options.token,
        spender: options.spender ?? permit2Address(chainId),
        amount: options.amount
          ? BigNumber.from(options.amount)
          : constants.MaxUint256,
        chainId,
        rpcUrl: getRpcUrl(chainId, options.rpcUrl),
      });
    });
}

function setupUniswapXV2() {
  const v2Command = new Command('v2');

  v2Command
    .command('quote')
    .description('Quote a UniswapX V2 order')
    .requiredOption('--tokenIn <tokenIn>', 'Token In')
    .requiredOption('--tokenOut <tokenOut>', 'Token Out')
    .requiredOption('--amount <amount>', 'Amount In Start')
    .requiredOption('--swapper <swapper>', 'Swapper')
    .addOption(
      new Option('--type <type>', 'Trade Type')
        .choices(['exactIn', 'exactOut'])
        .default('exactIn')
    )
    .option('--serialize', 'Return serialized order', false)
    .option('--cosigner [cosigner]', 'Cosigner')
    .option('-c, --chain-id [chainId]', 'chain id', ChainId.Mainnet.toString())
    .option('--openOrder', 'Force Open Order', false)
    .action(async (options) => {
      const globalOpts = program.optsWithGlobals();
      const config = getConfig(globalOpts.env, globalOpts.verbose);
      // eslint-disable-next-line prefer-const
      let { order, quote } = await quoteV2Order(
        {
          tokenIn: options.tokenIn,
          tokenOut: options.tokenOut,
          amount: options.amount,
          swapper: options.swapper,
          type: options.type,
        },
        config,
        options.chainId,
        {
          ...(options.openOrder && {
            useSyntheticQuotes: true,
            forceOpenOrders: true,
          }),
        }
      );

      // rebuild with overrides
      if (options.cosigner) {
        order = UnsignedV2DutchOrder.fromJSON(
          Object.assign(order.toJSON(), {
            ...(options.cosigner && {
              cosigner: options.cosigner,
            }),
          }),
          options.chainId
        );
      }

      if (options.serialize) {
        console.log(order.serialize());
      } else {
        // Print the raw quote object so it can be piped straight into
        // `v2 submit`, keeping the encoded order in sync with any overrides.
        console.log(
          JSON.stringify({ ...quote, encodedOrder: order.serialize() })
        );
      }
    });

  v2Command
    .command('submit')
    .description('Submit a UniswapX V2 order')
    .argument('<quote>', 'quote object JSON (as printed by `v2 quote`)')
    .option('--signature [signature]', 'signature')
    .option('--private-key [privateKey]', 'private key')
    .option('-c, --chain-id [chainId]', 'chain id', ChainId.Mainnet.toString())
    .action(async (quoteJson, options) => {
      const globalOpts = program.optsWithGlobals();
      const config = getConfig(globalOpts.env, globalOpts.verbose);
      const privateKey = options.privateKey ?? process.env.UNISWAP_PRIVATE_KEY;

      let quote: { readonly encodedOrder: string };
      try {
        quote = JSON.parse(quoteJson);
      } catch {
        console.error(
          'Invalid quote argument: expected the JSON quote object printed by `v2 quote`'
        );
        process.exit(1);
      }
      if (!quote.encodedOrder) {
        console.error('Quote object is missing `encodedOrder`');
        process.exit(1);
      }

      let signature: string;
      if (options.signature) {
        signature = options.signature;
      } else if (privateKey) {
        ({ signature } = await signV2Order(
          quote.encodedOrder,
          new Wallet(privateKey),
          options.chainId
        ));
      } else {
        console.error('Either signature or private key is required');
        process.exit(1);
      }
      await submitOrder(config, quote, signature, 'DUTCH_V2');
    });

  program.addCommand(v2Command);
}

function setupUniswapXV3() {
  const v3Command = new Command('v3');

  v3Command
    .command('quote')
    .description('Quote a UniswapX V3 order')
    .requiredOption('--tokenIn <tokenIn>', 'Token In')
    .requiredOption('--tokenOut <tokenOut>', 'Token Out')
    .requiredOption('--amount <amount>', 'Amount In Start')
    .requiredOption('--swapper <swapper>', 'Swapper')
    .addOption(
      new Option('--type <type>', 'Trade Type')
        .choices(['exactIn', 'exactOut'])
        .default('exactIn')
    )
    .option('--serialize', 'Return serialized order', false)
    .option('--cosigner [cosigner]', 'Cosigner')
    .option('-c, --chain-id [chainId]', 'chain id', ChainId.Arbitrum.toString())
    .option('--openOrder', 'Force Open Order', false)
    .option(
      '--deadlineBufferSecs [deadlineBufferSecs]',
      'Deadline Buffer Seconds'
    )
    .option('--slippageTolerance [slippageTolerance]', 'Slippage Tolerance')
    .action(async (options) => {
      const globalOpts = program.optsWithGlobals();
      const config = getConfig(globalOpts.env, globalOpts.verbose);
      const { quote } = await quoteV3Order(
        {
          tokenIn: options.tokenIn,
          tokenOut: options.tokenOut,
          amount: options.amount,
          swapper: options.swapper,
          type: options.type,
        },
        config,
        options.chainId,
        {
          ...(options.openOrder && {
            useSyntheticQuotes: true,
            forceOpenOrders: true,
          }),
          ...(options.deadlineBufferSecs !== undefined && {
            deadlineBufferSecs: parseInt(options.deadlineBufferSecs, 10),
          }),
        },
        options.slippageTolerance
      );

      // rebuild with overrides — overriding cosigner invalidates the existing
      // cosignature, so we produce a fresh unsigned order in that case.
      let encodedOrder: string;
      if (options.cosigner) {
        const overridden = UnsignedV3DutchOrder.fromJSON(
          Object.assign(
            JSON.parse(JSON.stringify(
              UnsignedV3DutchOrder.parse(quote.encodedOrder, options.chainId, permit2Address(parseInt(options.chainId))).toJSON()
            )),
            { cosigner: options.cosigner }
          ),
          options.chainId
        );
        encodedOrder = overridden.serialize();
      } else {
        encodedOrder = quote.encodedOrder;
      }

      if (options.serialize) {
        console.log(encodedOrder);
      } else {
        // Print the raw quote object so it can be piped straight into
        // `v3 submit`, keeping the encoded order in sync with any overrides.
        console.log(
          JSON.stringify({ ...quote, encodedOrder })
        );
      }
    });

  v3Command
    .command('submit')
    .description('Submit a UniswapX V3 order')
    .argument('<quote>', 'quote object JSON (as printed by `v3 quote`)')
    .option('--signature [signature]', 'signature')
    .option('--private-key [privateKey]', 'private key')
    .option('-c, --chain-id [chainId]', 'chain id', ChainId.Arbitrum.toString())
    .action(async (quoteJson, options) => {
      const globalOpts = program.optsWithGlobals();
      const config = getConfig(globalOpts.env, globalOpts.verbose);
      const privateKey = options.privateKey ?? process.env.UNISWAP_PRIVATE_KEY;

      let quote: { readonly encodedOrder: string };
      try {
        quote = JSON.parse(quoteJson);
      } catch {
        console.error(
          'Invalid quote argument: expected the JSON quote object printed by `v3 quote`'
        );
        process.exit(1);
      }
      if (!quote.encodedOrder) {
        console.error('Quote object is missing `encodedOrder`');
        process.exit(1);
      }

      let signature: string;
      if (options.signature) {
        signature = options.signature;
      } else if (privateKey) {
        ({ signature } = await signV3Order(
          quote.encodedOrder,
          new Wallet(privateKey),
          options.chainId
        ));
      } else {
        console.error('Either signature or private key is required');
        process.exit(1);
      }
      await submitOrder(config, quote, signature, 'DUTCH_V3');
    });

  program.addCommand(v3Command);
}

function setupPriority() {
  const priorityCommand = new Command('priority');

  priorityCommand
    .command('quote')
    .description('Quote a UniswapX priority order')
    .requiredOption('--tokenIn <tokenIn>', 'Token In')
    .requiredOption('--tokenOut <tokenOut>', 'Token Out')
    .requiredOption('--amount <amount>', 'Amount In Start')
    .requiredOption('--swapper <swapper>', 'Swapper')
    .addOption(
      new Option('--type <type>', 'Trade Type')
        .choices(['exactIn', 'exactOut'])
        .default('exactIn')
    )
    .option('--serialize', 'Return serialized order', false)
    .option('--cosigner [cosigner]', 'Cosigner')
    .option('-c, --chain-id [chainId]', 'chain id', '8453')
    .option('--slippageTolerance [slippageTolerance]', 'Slippage Tolerance')
    .action(async (options) => {
      const globalOpts = program.optsWithGlobals();
      const config = getConfig(globalOpts.env, globalOpts.verbose);
      // eslint-disable-next-line prefer-const
      let { order, quote } = await quotePriorityOrder(
        {
          tokenIn: options.tokenIn,
          tokenOut: options.tokenOut,
          amount: options.amount,
          swapper: options.swapper,
          type: options.type,
        },
        config,
        options.chainId,
        {},
        options.slippageTolerance
      );

      // rebuild with overrides
      if (options.cosigner) {
        order = UnsignedPriorityOrder.fromJSON(
          Object.assign(order.toJSON(), {
            ...(options.cosigner && {
              cosigner: options.cosigner,
            }),
          }),
          options.chainId
        );
      }

      if (options.serialize) {
        console.log(order.serialize());
      } else {
        // Print the raw quote object so it can be piped straight into
        // `priority submit`, keeping the encoded order in sync with overrides.
        console.log(
          JSON.stringify({ ...quote, encodedOrder: order.serialize() })
        );
      }
    });

  priorityCommand
    .command('submit')
    .description('Submit a UniswapX priority order')
    .argument('<quote>', 'quote object JSON (as printed by `priority quote`)')
    .option('--signature [signature]', 'signature')
    .option('--private-key [privateKey]', 'private key')
    .option('-c, --chain-id [chainId]', 'chain id', '1')
    .action(async (quoteJson, options) => {
      const globalOpts = program.optsWithGlobals();
      const config = getConfig(globalOpts.env, globalOpts.verbose);
      const privateKey = options.privateKey ?? process.env.UNISWAP_PRIVATE_KEY;

      let quote: { readonly encodedOrder: string };
      try {
        quote = JSON.parse(quoteJson);
      } catch {
        console.error(
          'Invalid quote argument: expected the JSON quote object printed by `priority quote`'
        );
        process.exit(1);
      }
      if (!quote.encodedOrder) {
        console.error('Quote object is missing `encodedOrder`');
        process.exit(1);
      }

      let signature: string;
      if (options.signature) {
        signature = options.signature;
      } else if (privateKey) {
        ({ signature } = await signPriorityOrder(
          quote.encodedOrder,
          new Wallet(privateKey),
          options.chainId
        ));
      } else {
        console.error('Either signature or private key is required');
        process.exit(1);
      }
      await submitOrder(config, quote, signature, 'PRIORITY');
    });

  program.addCommand(priorityCommand);
}

async function main() {
  setupProgram();
  program.parseAsync();
}

void main();
