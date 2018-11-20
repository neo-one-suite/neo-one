import { Context } from 'koa';
// tslint:disable next-line match-default-export-name
import tooBusy from 'toobusy-js';

export interface Options {
  readonly interval?: number;
  readonly maxLag?: number;
  readonly smoothingFactor?: number;
}

export const tooBusyCheck = (options: Options) => {
  if (options.interval !== undefined) {
    tooBusy.interval(options.interval);
  }
  if (options.maxLag !== undefined) {
    tooBusy.maxLag(options.maxLag);
  }
  if (options.smoothingFactor !== undefined) {
    tooBusy.smoothingFactor(options.smoothingFactor);
  }

  return async (ctx: Context, next: () => Promise<void>) => {
    if (tooBusy()) {
      ctx.status = 503;
    } else {
      await next();
    }
  };
};
