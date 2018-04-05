/* @flow */
import type { Context } from 'koa';
import { LABELS, type Monitor, metrics } from '@neo-one/monitor';

import { getMonitor } from './common';

const labelNames = [
  LABELS.HTTP_PATH,
  LABELS.HTTP_STATUS_CODE,
  LABELS.HTTP_METHOD,
];
const REQUESTS_HISTOGRAM = metrics.createHistogram({
  name: 'http_server_request_duration_seconds',
  labelNames,
});
const REQUEST_ERRORS_COUNTER = metrics.createCounter({
  name: 'http_server_request_failures_total',
  labelNames,
});

export default ({ monitor }: {| monitor: Monitor |}) => async (
  ctx: Context,
  next: () => Promise<void>,
) => {
  await monitor.forContext(ctx).captureSpanLog(
    async span => {
      try {
        ctx.state.monitor = span;
        await next();
      } finally {
        span.setLabels({
          [monitor.labels.HTTP_STATUS_CODE]: ctx.status,
          [monitor.labels.HTTP_PATH]: 'unknown',
        });
        const { router, routerName } = ctx;
        if (router != null && routerName != null) {
          const layer = router.route(routerName);
          if (layer) {
            span.setLabels({
              [monitor.labels.HTTP_PATH]: layer.path,
            });
          }
        }
      }
    },
    {
      name: 'http_server_request',
      level: { log: 'verbose', span: 'info' },
      metric: {
        total: REQUESTS_HISTOGRAM,
        error: REQUEST_ERRORS_COUNTER,
      },
      references: [
        monitor.childOf(monitor.extract(monitor.formats.HTTP, ctx.headers)),
      ],
      trace: true,
    },
  );
};

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
    name: 'http_server_request_uncaught_error',
    message: 'Unexpected uncaught request error.',
    error,
  });
};
