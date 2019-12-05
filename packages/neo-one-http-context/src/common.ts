import { Logger } from '@neo-one/logger';
import { Context } from 'koa';

type GetLoggerType = (ctx: Context) => Logger;
// tslint:disable-next-line: export-name
export const getLogger: GetLoggerType = (ctx) => {
  const { logger } = ctx.state;
  if (logger === undefined) {
    ctx.throw(500);
    throw new Error('For TS');
  }

  return logger;
};
