import { bodyParser, getMonitor } from '@neo-one/http';
import { KnownLabel, metrics, Monitor } from '@neo-one/monitor';
import { Context } from 'koa';
import compose from 'koa-compose';
import koaCompress from 'koa-compress';
import { Server } from '../Server';

const RPC_METHODS: { readonly [key: string]: string } = {
  executeTaskList: 'executeTaskList',
  request: 'request',
  ready: 'ready',
  UNKNOWN: 'UNKNOWN',
  INVALID: 'INVALID',
};

const rpcLabelNames: readonly string[] = [KnownLabel.RPC_METHOD];
const rpcLabels = Object.values(RPC_METHODS).map((method) => ({
  [KnownLabel.RPC_METHOD]: method,
}));

const SINGLE_REQUESTS_HISTOGRAM = metrics.createHistogram({
  name: 'http_rpc_server_single_request_duration_seconds',
  labelNames: rpcLabelNames,
  labels: rpcLabels,
});

const SINGLE_REQUEST_ERRORS_COUNTER = metrics.createCounter({
  name: 'http_rpc_server_single_request_failures_total',
  labelNames: rpcLabelNames,
  labels: rpcLabels,
});

interface RPCRequest {
  readonly method: string;
  // tslint:disable-next-line no-any
  readonly [key: string]: any;
}

interface RPCResult {
  readonly type: 'ok' | 'error';
  // tslint:disable-next-line no-any
  readonly [key: string]: any;
}

export const rpc = ({ server }: { readonly server: Server }) => {
  // tslint:disable-next-line no-any
  const validateRequest = (request: any): RPCRequest => {
    if (
      request !== undefined &&
      typeof request === 'object' &&
      request.method !== undefined &&
      typeof request.method === 'string'
    ) {
      return request;
    }

    throw new Error('Invalid Request');
  };

  // tslint:disable-next-line no-any
  const handleSingleRequest = async (monitor: Monitor, requestIn: any) =>
    monitor.captureSpanLog(
      async (span) => {
        let request;
        try {
          request = validateRequest(requestIn);
        } finally {
          let method = RPC_METHODS.UNKNOWN;
          if (request !== undefined) {
            ({ method } = request);
          } else if (typeof requestIn === 'object') {
            ({ method } = requestIn);
          }

          if ((RPC_METHODS[method] as string | undefined) === undefined) {
            method = RPC_METHODS.INVALID;
          }

          span.setLabels({ [span.labels.RPC_METHOD]: method });
        }

        let result: RPCResult;
        switch (request.method) {
          case 'executeTaskList':
            await server.pluginManager
              .getPlugin({ plugin: request.plugin })
              .executeTaskList(server.pluginManager, JSON.stringify(request.options))
              .toPromise();
            result = { type: 'ok', message: 'Success!' };
            break;
          case 'request':
            const response = await server.pluginManager
              .getPlugin({ plugin: request.plugin })
              .request(server.pluginManager, JSON.stringify(request.options));
            result = { type: 'ok', response };
            break;
          case 'ready':
            result = { type: 'ok' };
            break;
          default:
            throw new Error('Method not found');
        }

        return result;
      },
      {
        name: 'http_rpc_server_single_request',
        metric: {
          total: SINGLE_REQUESTS_HISTOGRAM,
          error: SINGLE_REQUEST_ERRORS_COUNTER,
        },

        level: { log: 'verbose', span: 'info' },
      },
    );

  const handleRequest = (monitor: Monitor, request: {}) => {
    if (Array.isArray(request)) {
      return Promise.all(request.map(async (batchRequest) => handleSingleRequest(monitor, batchRequest)));
    }

    return handleSingleRequest(monitor, request);
  };

  const handleRequestSafe = async (monitor: Monitor, request: {}): Promise<object | object[]> => {
    try {
      // tslint:disable-next-line prefer-immediate-return
      const result = await monitor.captureSpanLog(async (span) => handleRequest(span, request), {
        name: 'http_rpc_server_request',
        level: { log: 'verbose', span: 'info' },
        error: {},
      });

      // tslint:disable-next-line no-var-before-return
      return result;
    } catch (error) {
      return {
        type: 'error',
        message: error.message,
      };
    }
  };

  return {
    name: 'rpc',
    path: '/rpc',
    middleware: compose([
      koaCompress(),
      bodyParser(),
      async (ctx: Context): Promise<void> => {
        if (!ctx.is('application/json')) {
          return ctx.throw(415);
        }

        // tslint:disable-next-line no-any
        const { body } = ctx.request as any;
        const monitor = getMonitor(ctx);
        const result = await handleRequestSafe(monitor.withLabels({ [monitor.labels.RPC_TYPE]: 'http' }), body);

        ctx.status = 200;
        ctx.body = result;
      },
    ]),
  };
};
