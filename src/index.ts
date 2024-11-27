import { DutchOrder, UnsignedV2DutchOrder, UnsignedV3DutchOrder, UnsignedPriorityOrder } from '@uniswap/uniswapx-sdk';
import { Command, Option, program } from 'commander';
import { Wallet } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

import { buildOrder } from './build';
import { ChainId, getConfig } from './config';
import { quotePriorityOrder, quoteV1Order, quoteV2Order, quoteV3Order } from './quote';
import { signPriorityOrder, signV1Order, signV2Order, signV3Order } from './sign';
import { submitPriorityOrder, submitV1Order, submitV2Order, submitV3Order } from './submit';

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
        .default('beta')
    );

  setupUniswapXV1();
  setupUniswapXV2();
  setupUniswapXV3();
  setupPriority();
}

function setupUniswapXV1() {
  const v1Command = new Command('v1');

  v1Command
    .command('quote')
    .description('Quote a UniswapX order')
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
    .option('--exclusive-filler [exclusiveFiller]', 'Exclusive Filler')
    .option(
      '--exclusivity-override-bps [exclusivityOverrideBps]',
      'Exclusivity Override Bps'
    )
    .action(async (options) => {
      const globalOpts = program.optsWithGlobals();
      const config = getConfig(globalOpts.env);
      // eslint-disable-next-line prefer-const
      let { order, quoteId } = await quoteV1Order(
        {
          tokenIn: options.tokenIn,
          tokenOut: options.tokenOut,
          amount: options.amount,
          swapper: options.swapper,
          type: options.type,
        },
        config
      );

      // rebuild with overrides
      if (options.exclusiveFiller || options.exclusivityOverrideBps) {
        order = DutchOrder.fromJSON(
          Object.assign(order.toJSON(), {
            ...(options.exclusiveFiller && {
              exclusiveFiller: options.exclusiveFiller,
            }),
            ...(options.exclusivityOverrideBps && {
              exclusivityOverrideBps: options.exclusivityOverrideBps,
            }),
          }),
          ChainId.Mainnet
        );
      }

      if (options.serialize) {
        console.log(order.serialize());
      } else {
        console.log({
          ...order.toJSON(),
          quoteId: quoteId,
        });
      }
    });

  v1Command
    .command('build')
    .description('Build a UniswapX order')
    .requiredOption('--tokenIn <tokenIn>', 'Token In')
    .requiredOption('--tokenOut <tokenOut>', 'Token Out')
    .requiredOption('--amountInStart <amountInStart>', 'Amount In Start')
    .requiredOption('--amountInEnd <amountInEnd>', 'Amount In End')
    .requiredOption('--amountOutStart <amountOutStart>', 'Amount Out Start')
    .requiredOption('--amountOutEnd <amountOutEnd>', 'Amount Out End')
    .requiredOption('--swapper <swapper>', 'Swapper')
    .option('--serialize', 'Return serialized order', false)
    .option('--exclusive-filler [exclusiveFiller]', 'Exclusive Filler')
    .option(
      '--exclusivity-override-bps [exclusivityOverrideBps]',
      'Exclusivity Override Bps'
    )
    .option('--add-fee-output', 'Add an additional output', false)
    .action(async (options) => {
      const order = buildOrder({
        tokenIn: options.tokenIn,
        tokenOut: options.tokenOut,
        amountInStart: options.amountInStart,
        amountInEnd: options.amountInEnd,
        amountOutStart: options.amountOutStart,
        amountOutEnd: options.amountOutEnd,
        swapper: options.swapper,
        exclusiveFiller: options.exclusiveFiller,
        exclusivityOverrideBps: options.exclusivityOverrideBps,
        addFeeOutput: options.addFeeOutput,
      });
      if (options.serialize) {
        console.log(order.serialize());
      } else {
        console.log(order.toJSON());
      }
    });

  v1Command
    .command('submit')
    .description('Submit a UniswapX order')
    .argument('<serializedOrder>', 'serialized order')
    .option('--signature [signature]', 'signature')
    .option('--private-key [privateKey]', 'private key')
    .option('--quote-id [quoteId]', 'add quote id to order')
    .option('--random-qid', 'add random quote id to order')
    .action(async (serializedOrder, options) => {
      const globalOpts = program.optsWithGlobals();
      const config = getConfig(globalOpts.env);
      let signature: string;
      let quoteId: string;
      if (options.quoteId) {
        quoteId = options.quoteId;
      } else if (options.randomQid) {
        quoteId = uuidv4();
      }
      if (options.signature) {
        signature = options.signature;
      } else if (options.privateKey) {
        ({ signature } = await signV1Order(
          serializedOrder,
          new Wallet(options.privateKey)
        ));
      } else {
        console.error('Either signature or private key is required');
        process.exit(1);
      }
      await submitV1Order(config, serializedOrder, signature, quoteId);
    });

  program.addCommand(v1Command);
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
      const config = getConfig(globalOpts.env);
      // eslint-disable-next-line prefer-const
      let { order, quoteId } = await quoteV2Order(
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
          useSyntheticQuotes: options.openOrder,
          forceOpenOrders: options.openOrder,
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
        console.log({
          ...order.toJSON(),
          quoteId: quoteId,
        });
      }
    });

  v2Command
    .command('submit')
    .description('Submit a UniswapX V2 order')
    .argument('<serializedOrder>', 'serialized order')
    .option('--signature [signature]', 'signature')
    .option('--private-key [privateKey]', 'private key')
    .option('--quote-id [quoteId]', 'add quote id to order')
    .option('-c, --chain-id [chainId]', 'chain id', ChainId.Mainnet.toString())
    .option('--random-qid', 'add random quote id to order')
    .action(async (serializedOrder, options) => {
      const globalOpts = program.optsWithGlobals();
      const config = getConfig(globalOpts.env);
      let signature: string;
      let quoteId: string;
      if (options.quoteId) {
        quoteId = options.quoteId;
      } else if (options.randomQid) {
        quoteId = uuidv4();
      }
      if (options.signature) {
        signature = options.signature;
      } else if (options.privateKey) {
        ({ signature } = await signV2Order(
          serializedOrder,
          new Wallet(options.privateKey),
          options.chainId
        ));
      } else {
        console.error('Either signature or private key is required');
        process.exit(1);
      }
      await submitV2Order(
        config,
        serializedOrder,
        signature,
        options.chainId,
        quoteId
      );
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
    .option('--openOrder', 'Force Open Order', true)
    .action(async (options) => {
      const globalOpts = program.optsWithGlobals();
      const config = getConfig(globalOpts.env);
      // eslint-disable-next-line prefer-const
      let { order, quoteId } = await quoteV3Order(
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
          useSyntheticQuotes: options.openOrder,
          forceOpenOrders: options.openOrder,
        }
      );

      // rebuild with overrides
      if (options.cosigner) {
        order = UnsignedV3DutchOrder.fromJSON(
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
        console.log({
          ...order.toJSON(),
          quoteId: quoteId,
        });
      }
    });

  v3Command
    .command('submit')
    .description('Submit a UniswapX V3 order')
    .argument('<serializedOrder>', 'serialized order')
    .option('--signature [signature]', 'signature')
    .option('--private-key [privateKey]', 'private key')
    .option('--quote-id [quoteId]', 'add quote id to order')
    .option('-c, --chain-id [chainId]', 'chain id', ChainId.Arbitrum.toString())
    .option('--random-qid', 'add random quote id to order')
    .action(async (serializedOrder, options) => {
      const globalOpts = program.optsWithGlobals();
      const config = getConfig(globalOpts.env);
      let signature: string;
      let quoteId: string;
      if (options.quoteId) {
        quoteId = options.quoteId;
      } else if (options.randomQid) {
        quoteId = uuidv4();
      }
      if (options.signature) {
        signature = options.signature;
      } else if (options.privateKey) {
        ({ signature } = await signV3Order(
          serializedOrder,
          new Wallet(options.privateKey),
          options.chainId
        ));
      } else {
        console.error('Either signature or private key is required');
        process.exit(1);
      }
      await submitV3Order(
        config,
        serializedOrder,
        signature,
        options.chainId,
        quoteId
      );
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
    .action(async (options) => {
      const globalOpts = program.optsWithGlobals();
      const config = getConfig(globalOpts.env);
      // eslint-disable-next-line prefer-const
      let { order, quoteId } = await quotePriorityOrder(
        {
          tokenIn: options.tokenIn,
          tokenOut: options.tokenOut,
          amount: options.amount,
          swapper: options.swapper,
          type: options.type,
        },
        config,
        options.chainId,
        options.openOrder
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
        console.log({
          ...order.toJSON(),
          quoteId: quoteId,
        });
      }
    });

  priorityCommand
    .command('submit')
    .description('Submit a UniswapX priority order')
    .argument('<serializedOrder>', 'serialized order')
    .option('--signature [signature]', 'signature')
    .option('--private-key [privateKey]', 'private key')
    .option('--quote-id [quoteId]', 'add quote id to order')
    .option('-c, --chain-id [chainId]', 'chain id', '1')
    .option('--random-qid', 'add random quote id to order')
    .action(async (serializedOrder, options) => {
      const globalOpts = program.optsWithGlobals();
      const config = getConfig(globalOpts.env);
      let signature: string;
      let quoteId: string;
      if (options.quoteId) {
        quoteId = options.quoteId;
      } else if (options.randomQid) {
        quoteId = uuidv4();
      }
      if (options.signature) {
        signature = options.signature;
      } else if (options.privateKey) {
        ({ signature } = await signPriorityOrder(
          serializedOrder,
          new Wallet(options.privateKey),
          options.chainId
        ));
      } else {
        console.error('Either signature or private key is required');
        process.exit(1);
      }
      await submitPriorityOrder(
        config,
        serializedOrder,
        signature,
        options.chainId,
        quoteId
      );
    });

  program.addCommand(priorityCommand);
}

async function main() {
  setupProgram();
  program.parseAsync();
}

void main();
