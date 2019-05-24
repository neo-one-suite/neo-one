import { Context } from 'koa';
// tslint:disable next-line match-default-export-name
import tooBusy from 'toobusy-js';
import { TooBusyCheckOptions } from './tooBusyCheckOptions';

export const tooBusyCheck = (options: TooBusyCheckOptions) => {
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
