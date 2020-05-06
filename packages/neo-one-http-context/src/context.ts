import { createChild, Logger } from '@neo-one/logger';
import { Labels } from '@neo-one/utils';
import { Context } from 'koa';

const getContextLabels = (ctx: Context) => {
  const spanLabels = {
    [Labels.HTTP_METHOD]: ctx.request.method,
    [Labels.SPAN_KIND]: 'server',
    [Labels.HTTP_REQUEST_PROTOCOL]: ctx.request.protocol,
  };

  return {
    logLabels: {
      [Labels.HTTP_HEADERS]: JSON.stringify(ctx.request.headers),
      [Labels.HTTP_URL]: ctx.request.originalUrl,
      [Labels.HTTP_FULLPATH]: ctx.request.path,
      [Labels.HTTP_REQUEST_QUERY]: ctx.request.querystring,
      [Labels.PEER_ADDRESS]: ctx.request.ip,
      [Labels.PEER_PORT]: ctx.request.socket.remotePort,
      [Labels.HTTP_REQUEST_SIZE]: ctx.request.length,
      ...spanLabels,
    },
  };
};
type ContextFunctionType = (logger: Logger) => (ctx: Context, next: () => Promise<void>) => Promise<void>;
export const context: ContextFunctionType = (logger) => async (ctx, next) => {
  const { logLabels } = getContextLabels(ctx);
  const childLogger = createChild(logger, { service: 'http-server', ...logLabels });
  ctx.state.logger = childLogger;
  try {
    await next();

    childLogger.debug({ name: 'http_server_request' });
  } catch (err) {
    childLogger.error({ name: 'http_server_request', err });

    throw err;
  }
};

type OnErrorFunctionType = (logger: Logger) => (err: Error, ctx?: Context) => void;
export const onError: OnErrorFunctionType = (logger) => (err, ctx) => {
  const labels = ctx !== undefined ? getContextLabels(ctx).logLabels : {};
  logger.error({ name: 'http_server_request_uncaught_error', err, ...labels }, 'Unexpected uncaught request error.');
};
