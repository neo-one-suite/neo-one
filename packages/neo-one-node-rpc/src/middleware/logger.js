/* @flow */
import type { Context } from 'koa';
import type { Log } from '@neo-one/utils';

import { getLog, simpleMiddleware } from './common';

const nowSeconds = () => Date.now() / 1000;

const getLatencySeconds = (startTimeSeconds: number) => {
  const latencySeconds = nowSeconds() - startTimeSeconds;
  return Math.round(latencySeconds * 1000) / 1000;
};

export default simpleMiddleware(
  'logger',
  async (ctx: Context, next: () => Promise<void>) => {
    const startTimeSeconds = nowSeconds();
    const log = getLog(ctx);
    try {
      await next();
    } catch (error) {
      if (error.code !== 'ECONNABORTED') {
        log({
          event: 'REQUEST_ERROR',
          error,
          httpRequest: { latency: getLatencySeconds(startTimeSeconds) },
        });
      }

      throw error;
    } finally {
      log({
        event: 'REQUEST',
        httpRequest: { latency: getLatencySeconds(startTimeSeconds) },
      });
    }
  },
);

export const onError = ({ log: logIn }: {| log: Log |}) => (
  error: Error,
  ctx?: Context,
) => {
  let log = logIn;
  if (ctx != null) {
    try {
      log = getLog(ctx);
    } catch (err) {
      // Ignore errors
    }
  }

  log({ event: 'UNEXPECTED_REQUEST_ERROR', error });
};
