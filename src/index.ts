import { DutchOrder } from '@uniswap/uniswapx-sdk';
import { Option, program } from 'commander';
import { Wallet } from 'ethers';

import { buildOrder } from './build';
import { CHAIN_ID, getConfig } from './config';
import { quoteOrder } from './quote';
import { signOrder } from './sign';
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
        .default('beta')
    );

  program
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
      let order = await quoteOrder(
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
          CHAIN_ID
        );
      }

      if (options.serialize) {
        console.log(order.serialize());
      } else {
        console.log(order.toJSON());
      }
    });

  program
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
      });
      if (options.serialize) {
        console.log(order.serialize());
      } else {
        console.log(order.toJSON());
      }
    });

  program
    .command('submit')
    .description('Submit a UniswapX order')
    .argument('<serializedOrder>', 'serialized order')
    .option('--signature [signature]', 'signature')
    .option('--private-key [privateKey]', 'private key')
    .action(async (serializedOrder, options) => {
      const globalOpts = program.optsWithGlobals();
      const config = getConfig(globalOpts.env);
      let signature: string;
      if (options.signature) {
        signature = options.signature;
      } else if (options.privateKey) {
        ({ signature } = await signOrder(
          serializedOrder,
          new Wallet(options.privateKey)
        ));
      } else {
        console.error('Either signature or private key is required');
        process.exit(1);
      }
      await submitOrder(config, serializedOrder, signature);
    });
}

async function main() {
  setupProgram();
  program.parseAsync();
}

void main();
