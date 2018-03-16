/* @flow */
import type { Context } from 'koa';
import type { Monitor } from '@neo-one/monitor';

import { getMonitor, simpleMiddleware } from './common';

export default simpleMiddleware(
  'logger',
  async (ctx: Context, next: () => Promise<void>) => {
    const monitor = getMonitor(ctx);
    await monitor.captureSpan(
      span =>
        span.captureLogSingle(
          async () => {
            try {
              await next();
            } finally {
              span.setLabels({ [monitor.labels.HTTP_STATUS_CODE]: ctx.status });
            }
          },
          {
            name: 'http_request',
            message: `Handled request for ${ctx.originalUrl || ctx.url}`,
            level: 'verbose',
            error: `Request failed for ${ctx.originalUrl || ctx.url}`,
          },
        ),
      { name: 'http_request' },
    );
  },
);

export const onError = ({ monitor: monitorIn }: {| monitor: Monitor |}) => (
  error: Error,
  ctx?: Context,
) => {
  let monitor = monitorIn;
  if (ctx != null) {
    try {
      monitor = getMonitor(ctx);
    } catch (err) {
      // Ignore errors
    }
  }

  monitor.logError({
    name: 'uncaught_request',
    message: 'Unexpected uncaught request error.',
    error,
  });
};
