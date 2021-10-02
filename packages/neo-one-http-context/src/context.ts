import { AggregationType, globalStats, MeasureUnit, SpanKind, tracer } from '@neo-one/client-switch';
import { createChild, Logger } from '@neo-one/logger';
import { addAttributesToSpan, Labels, labelsToTags, utils } from '@neo-one/utils';
import { Context } from 'koa';

const labelNames: readonly string[] = [Labels.HTTP_PATH, Labels.HTTP_STATUS_CODE, Labels.HTTP_METHOD];

const requestSec = globalStats.createMeasureInt64('requests/duration', MeasureUnit.SEC);
const requestErrors = globalStats.createMeasureInt64('requests/failures', MeasureUnit.UNIT);

const REQUESTS_HISTOGRAM = globalStats.createView(
  'http_server_request_duration_seconds',
  requestSec,
  AggregationType.DISTRIBUTION,
  labelsToTags(labelNames),
  'Distribution of the requests duration',
  [1, 2, 5, 7.5, 10, 12.5, 15, 17.5, 20],
);
globalStats.registerView(REQUESTS_HISTOGRAM);

const REQUEST_ERRORS_COUNTER = globalStats.createView(
  'http_server_request_failures_total',
  requestErrors,
  AggregationType.COUNT,
  labelsToTags(labelNames),
  'Total request failures',
);
globalStats.registerView(REQUEST_ERRORS_COUNTER);

const getContextLabels = (ctx: Context) => {
  const spanLabels = {
    [Labels.HTTP_METHOD]: ctx.request.method,
    [Labels.SPAN_KIND]: 'server',
    [Labels.HTTP_REQUEST_PROTOCOL]: ctx.request.protocol,
    [Labels.HTTP_HEADERS]: JSON.stringify(ctx.request.headers),
    [Labels.HTTP_URL]: ctx.request.originalUrl,
    [Labels.HTTP_FULLPATH]: ctx.request.path,
    [Labels.HTTP_REQUEST_QUERY]: ctx.request.querystring,
    [Labels.PEER_ADDRESS]: ctx.request.ip,
    [Labels.PEER_PORT]: ctx.request.socket?.remotePort ?? 'undefined',
    [Labels.HTTP_REQUEST_SIZE]: ctx.request.length,
  };

  return {
    spanLabels,
    logLabels: spanLabels,
  };
};
type ContextFunctionType = (logger: Logger) => (ctx: Context, next: () => Promise<void>) => Promise<void>;
export const context: ContextFunctionType = (logger) => async (ctx, next) => {
  const spanExtract = tracer.propagation.extract({ getHeader: (name: string) => ctx.headers[name] });
  const spanContext = spanExtract !== null ? spanExtract : undefined;
  const { spanLabels, logLabels } = getContextLabels(ctx);
  const childLogger = createChild(logger, { service: 'http-server', ...logLabels });
  ctx.state.logger = childLogger;
  await tracer.startRootSpan({ spanContext, name: 'http_server_request', kind: SpanKind.SERVER }, async (span) => {
    addAttributesToSpan(span, spanLabels);
    const startTime = utils.nowSeconds();
    try {
      try {
        await next();
      } finally {
        addAttributesToSpan(span, {
          [Labels.HTTP_STATUS_CODE]: ctx.status,
          [Labels.HTTP_PATH]: 'unknown',
        });
        // tslint:disable-next-line no-any
        const { router, routerName } = ctx as any;
        if (router != undefined && routerName != undefined) {
          const layer = router.route(routerName);
          if (layer) {
            span.addAttribute(Labels.HTTP_PATH, layer.path);
          }
        }
      }
      childLogger.debug({ name: 'http_server_request' });
    } catch (err) {
      childLogger.error({ name: 'http_server_request', err });
      globalStats.record([
        {
          measure: requestErrors,
          value: 1,
        },
      ]);

      throw err;
    } finally {
      globalStats.record([
        {
          measure: requestSec,
          value: utils.nowSeconds() - startTime,
        },
      ]);
      span.end();
    }
  });
};

type OnErrorFunctionType = (logger: Logger) => (err: Error, ctx?: Context) => void;
export const onError: OnErrorFunctionType = (logger) => (err, ctx) => {
  const labels = ctx !== undefined ? getContextLabels(ctx).logLabels : {};
  logger.error({ name: 'http_server_request_uncaught_error', err, ...labels }, 'Unexpected uncaught request error.');
};
