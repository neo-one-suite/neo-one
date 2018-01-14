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
|}) =>
  simpleMiddleware(
    'readyHealthCheck',
    mount('/ready_health_check', async (ctx: Context) => {
      const { ready, index } = await checkReady({ blockchain, options });
      const log = getLog(ctx);
      if (ready) {
        ctx.status = 200;
      } else {
        log({
          event: 'READY_HEALTH_CHECK_ERROR',
          index,
          currentBlockIndex: blockchain.currentBlockIndex,
        });
        ctx.status = 500;
      }
    }),
  );
