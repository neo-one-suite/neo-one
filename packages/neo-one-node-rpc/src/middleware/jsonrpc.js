/* @flow */
import type { Context, Middleware } from 'koa';
import type { Monitor } from '@neo-one/monitor';

import compose from 'koa-compose';
import compress from 'koa-compress';

import bodyParser from './bodyParser';
import { getMonitor } from './common';

export type HandlerPrimitive = string | number | boolean;

export type HandlerResult =
  | ?Object
  | ?Array<Object | HandlerPrimitive>
  | ?HandlerPrimitive
  | void;
export type Handler = (
  args: Array<any>,
  monitor: Monitor,
  ctx: Context,
) => Promise<HandlerResult>;
type Handlers = { [method: string]: Handler };

type JSONRPCRequest = {
  jsonrpc: '2.0',
  id?: ?number,
  method: string,
  params?: Array<any> | Object,
};

export class JSONRPCError {
  code: number;
  message: string;

  constructor(code: number, message: string) {
    this.code = code;
    this.message = message;
  }
}

export default (handlers: Handlers): Middleware => {
  const validateRequest = (ctx: Context, request: Object): JSONRPCRequest => {
    if (
      request != null &&
      typeof request === 'object' &&
      request.jsonrpc === '2.0' &&
      request.method != null &&
      typeof request.method === 'string' &&
      (request.params == null ||
        Array.isArray(request.params) ||
        typeof request.params === 'object') &&
      (request.id == null ||
        typeof request.id === 'string' ||
        typeof request.id === 'number')
    ) {
      return request;
    }

    throw new JSONRPCError(-32600, 'Invalid Request');
  };

  const handleSingleRequest = async (
    monitor: Monitor,
    ctx: Context,
    requestIn: any,
  ) =>
    monitor.captureSpanLog(
      async span => {
        let request;
        try {
          request = validateRequest(ctx, requestIn);
        } finally {
          span.setLabels({
            [span.labels.RPC_METHOD]:
              request == null ? 'UNKNOWN' : request.method,
          });
        }
        const handler = handlers[request.method];
        if (handler == null) {
          throw new JSONRPCError(-32601, 'Method not found');
        }

        let { params } = request;
        if (params == null) {
          params = [];
        } else if (!Array.isArray(params)) {
          params = [params];
        }

        const result = await handler(params, monitor, ctx);
        return {
          jsonrpc: '2.0',
          result,
          id: request.id == null ? null : request.id,
        };
      },
      {
        name: 'http_jsonrpc_single_request',
        level: { log: 'verbose', metric: 'info', span: 'info' },
      },
    );

  const handleRequest = (monitor: Monitor, ctx: Context, request: mixed) => {
    if (Array.isArray(request)) {
      return Promise.all(
        request.map(batchRequest =>
          handleSingleRequest(monitor, ctx, batchRequest),
        ),
      );
    }

    return handleSingleRequest(monitor, ctx, request);
  };

  const handleRequestSafe = async (
    monitor: Monitor,
    ctx: Context,
    request: mixed,
  ): Promise<Object | Array<any>> => {
    try {
      const result = await monitor.captureSpanLog(
        span => handleRequest(span, ctx, request),
        {
          name: 'http_jsonrpc_request',
          level: { log: 'verbose', metric: 'info', span: 'info' },
          references: [
            monitor.childOf(monitor.extract(monitor.formats.HTTP, ctx.headers)),
          ],
        },
      );
      return result;
    } catch (error) {
      let errorResponse = {
        code: -32603,
        message: 'Internal error',
      };
      if (
        error.code != null &&
        error.message != null &&
        typeof error.code === 'number' &&
        typeof error.message === 'string'
      ) {
        errorResponse = { code: error.code, message: error.message };
      }

      return {
        jsonrpc: '2.0',
        error: errorResponse,
        id: null,
      };
    }
  };

  return compose([
    compress(),
    bodyParser(),
    async (ctx: Context): Promise<void> => {
      if (ctx.method !== 'POST') {
        ctx.set('Allow', 'POST');
        return ctx.throw(405);
      }

      if (!ctx.is('application/json')) {
        return ctx.throw(415);
      }

      const { fields } = ctx.request;
      const monitor = getMonitor(ctx);
      const result = await handleRequestSafe(
        monitor.withLabels({
          [monitor.labels.HTTP_PATH]: '/rpc',
          [monitor.labels.RPC_TYPE]: 'jsonrpc',
        }),
        ctx,
        fields,
      );
      ctx.body = result;

      return undefined;
    },
  ]);
};
