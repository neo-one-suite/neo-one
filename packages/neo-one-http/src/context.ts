import { KnownLabel, metrics, Monitor } from '@neo-one/monitor';
import { Context } from 'koa';
import { getMonitor } from './common';

const labelNames: ReadonlyArray<string> = [KnownLabel.HTTP_PATH, KnownLabel.HTTP_STATUS_CODE, KnownLabel.HTTP_METHOD];

const REQUESTS_HISTOGRAM = metrics.createHistogram({
  name: 'http_server_request_duration_seconds',
  labelNames,
});

const REQUEST_ERRORS_COUNTER = metrics.createCounter({
  name: 'http_server_request_failures_total',
  labelNames,
});

export const context = ({ monitor }: { readonly monitor: Monitor }) => async (
  ctx: Context,
  next: () => Promise<void>,
) => {
  await monitor.forContext(ctx).captureSpanLog(
    async (span) => {
      try {
        ctx.state.monitor = span;
        await next();
      } finally {
        span.setLabels({
          [monitor.labels.HTTP_STATUS_CODE]: ctx.status,
          [monitor.labels.HTTP_PATH]: 'unknown',
        });

        // tslint:disable-next-line no-any
        const { router, routerName } = ctx as any;
        if (router != undefined && routerName != undefined) {
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

      references: [monitor.childOf(monitor.extract(monitor.formats.HTTP, ctx.headers))],

      trace: true,
    },
  );
};

export const onError = ({ monitor: monitorIn }: { readonly monitor: Monitor }) => (error: Error, ctx?: Context) => {
  let monitor = monitorIn;
  if (ctx !== undefined) {
    try {
      monitor = getMonitor(ctx);
    } catch {
      // Ignore errors
    }
  }

  monitor.logError({
    name: 'http_server_request_uncaught_error',
    message: 'Unexpected uncaught request error.',
    error,
  });
};
