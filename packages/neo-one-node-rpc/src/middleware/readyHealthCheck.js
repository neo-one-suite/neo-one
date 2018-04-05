/* @flow */
import type { Blockchain } from '@neo-one/node-core';
import type { Context } from 'koa';

import checkReady, { type Options as CheckReadyOptions } from './checkReady';
import { getMonitor } from './common';

export type Options = CheckReadyOptions;

export default ({
  blockchain,
  options,
}: {|
  blockchain: Blockchain,
  options: Options,
|}) => ({
  name: 'readyHealthCheck',
  path: '/ready_health_check',
  middleware: async (ctx: Context) => {
    const monitor = getMonitor(ctx);
    const ready = await checkReady({ monitor, blockchain, options });
    if (ready) {
      ctx.status = 200;
    } else {
      ctx.status = 500;
    }
  },
});
