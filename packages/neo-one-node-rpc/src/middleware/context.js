/* @flow */
import type { Context } from 'koa';
import type { Monitor } from '@neo-one/monitor';

import { simpleMiddleware } from './common';

export default ({ monitor }: {| monitor: Monitor |}) =>
  simpleMiddleware(
    'context',
    async (ctx: Context, next: () => Promise<void>) => {
      ctx.state.monitor = monitor.forContext(ctx);

      await next();
    },
  );
