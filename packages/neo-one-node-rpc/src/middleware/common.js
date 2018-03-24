/* @flow */
import type { Context } from 'koa';
import type { Monitor } from '@neo-one/monitor';

// eslint-disable-next-line
export const getMonitor = (ctx: Context): Monitor => {
  const { monitor } = ctx.state;
  if (monitor == null) {
    ctx.throw(500);
    throw new Error('For Flow');
  }
  return monitor;
};
