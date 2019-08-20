import { getLogger } from '@neo-one/http-context';
import { Blockchain } from '@neo-one/node-core';
import { Context } from 'koa';
import { checkReady, Options as CheckReadyOptions } from './checkReady';

export type Options = CheckReadyOptions;

export const liveHealthCheck = ({
  blockchain,
  options,
}: {
  readonly blockchain: Blockchain;
  readonly options: Options;
}) => {
  let lastBlockIndex: number | undefined;

  return {
    name: 'liveHealthCheck',
    path: '/live_health_check',
    middleware: async (ctx: Context) => {
      const logger = getLogger(ctx);
      const ready = await checkReady({ logger, blockchain, options });
      if (
        ready ||
        lastBlockIndex === undefined ||
        lastBlockIndex < blockchain.currentBlockIndex ||
        blockchain.isPersistingBlock
      ) {
        lastBlockIndex = blockchain.currentBlockIndex;
        ctx.status = 200;
      } else {
        ctx.status = 500;
      }
    },
  };
};
