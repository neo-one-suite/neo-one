/* @flow */
import type { Blockchain } from '@neo-one/node-core';
import type { Context } from 'koa';

import mount from 'koa-mount';

import checkReady, { type Options as CheckReadyOptions } from './checkReady';
import { getLog, simpleMiddleware } from './common';

export type Options = CheckReadyOptions;

export default ({
  blockchain,
  options,
}: {|
  blockchain: Blockchain,
  options: Options,
|}) => {
  let lastBlockIndex;
  return simpleMiddleware(
    'liveHealthCheck',
    mount('/live_health_check', async (ctx: Context) => {
      const log = getLog(ctx);
      const { ready, index } = await checkReady({ blockchain, options });
      if (
        ready ||
        lastBlockIndex == null ||
        lastBlockIndex < blockchain.currentBlockIndex ||
        blockchain.isPersistingBlock
      ) {
        lastBlockIndex = blockchain.currentBlockIndex;
        ctx.status = 200;
      } else {
        log({
          event: 'LIVE_HEALTH_CHECK_ERROR',
          index,
          ready,
          isPersistingBlock: blockchain.isPersistingBlock,
          lastBlockIndex,
          currentBlockIndex: blockchain.currentBlockIndex,
        });
        ctx.status = 500;
      }
    }),
  );
};
