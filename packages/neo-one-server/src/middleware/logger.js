/* @flow */
import type { Context } from 'mali';
import { utils } from '@neo-one/utils';

import compose from 'mali-compose';
import onError from 'mali-onerror';

import { getLog } from './common';

const getLatencySeconds = (startTimeSeconds: number) => {
  const latencySeconds = utils.nowSeconds() - startTimeSeconds;
  return Math.round(latencySeconds * 1000) / 1000;
};

export default compose([
  async (ctx: Context, next: () => Promise<void>) => {
    const log = getLog(ctx);
    const startTimeSeconds = utils.nowSeconds();
    try {
      await next();
    } finally {
      log({
        event: 'REQUEST',
        start: startTimeSeconds,
        latency: getLatencySeconds(startTimeSeconds),
      });
    }
  },
  onError((error: Error, ctx: Context) => {
    const log = getLog(ctx);
    log({ event: 'REQUEST_ERROR', error });
  }),
]);
