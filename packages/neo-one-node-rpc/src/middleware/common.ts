import { Monitor } from '@neo-one/monitor';
import { Context } from 'koa';

// tslint:disable-next-line export-name
export const getMonitor = (ctx: Context): Monitor => {
  const { monitor } = ctx.state;
  if (monitor === undefined) {
    ctx.throw(500);
    throw new Error('For TS');
  }

  return monitor;
};
