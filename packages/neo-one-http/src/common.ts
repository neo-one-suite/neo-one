import { Logger } from '@neo-one/logger';
import { Context } from 'koa';

// tslint:disable-next-line: export-name
export const getLogger = (ctx: Context): Logger => {
  const { logger } = ctx.state;
  if (logger === undefined) {
    ctx.throw(500);
    throw new Error('For TS');
  }

  return logger;
};
