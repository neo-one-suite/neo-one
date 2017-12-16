/* @flow */
import type { Context } from 'koa';

import mount from 'koa-mount';

import { simpleMiddleware } from './common';

export default simpleMiddleware(
  'liveHealthCheck',
  mount('/live_health_check', async (ctx: Context): Promise<void> => {
    ctx.status = 200;
  }),
);
