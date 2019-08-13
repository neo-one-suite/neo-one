import { AggregationType, globalStats, MeasureUnit, TagMap } from '@neo-one/client-switch';
import { bodyParser, getLogger } from '@neo-one/http';
import { Logger } from '@neo-one/logger';
import { Labels, labelToTag } from '@neo-one/utils';
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

const rpcTag = labelToTag(Labels.RPC_METHOD);

const durationMS = globalStats.createMeasureInt64('request/duration', MeasureUnit.SEC);
const requestsFailures = globalStats.createMeasureInt64('request/failures', MeasureUnit.UNIT);

const SINGLE_REQUESTS_HISTOGRAM = globalStats.createView(
  'http_rpc_server_single_request_duration_seconds',
  durationMS,
  AggregationType.DISTRIBUTION,
  [rpcTag],
  'distribution of single requests duration',
  [1, 2, 5, 7.5, 10, 12.5, 15, 17.5, 20],
);
globalStats.registerView(SINGLE_REQUESTS_HISTOGRAM);

const SINGLE_REQUEST_ERRORS_COUNTER = globalStats.createView(
  'http_rpc_server_single_request_failures_total',
  requestsFailures,
  AggregationType.COUNT,
  [rpcTag],
  'total number of rpc request failures',
);
globalStats.registerView(SINGLE_REQUEST_ERRORS_COUNTER);

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
  const handleSingleRequest = async (logger: Logger, requestIn: any) => {
    let result: RPCResult;
    const startTime = Date.now();
    let request;
    let method = RPC_METHODS.UNKNOWN;
    try {
      try {
        request = validateRequest(requestIn);
      } finally {
        if (request !== undefined) {
          ({ method } = request);
        } else if (typeof requestIn === 'object') {
          ({ method } = requestIn);
        }

        if ((RPC_METHODS[method] as string | undefined) === undefined) {
          method = RPC_METHODS.INVALID;
        }
      }

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
      logger.debug({ title: 'http_rpc_server_single_request', [Labels.RPC_METHOD]: request.method });

      const tags = new TagMap();
      tags.set(rpcTag, { value: method });
      globalStats.record(
        [
          {
            measure: durationMS,
            value: Date.now() - startTime,
          },
        ],
        tags,
      );
    } catch (error) {
      logger.error({ title: 'http_rpc_server_single_request', error });

      const tags = new TagMap();
      tags.set(rpcTag, { value: method });
      globalStats.record(
        [
          {
            measure: requestsFailures,
            value: 1,
          },
        ],
        tags,
      );
      throw error;
    }

    return result;
  };

  const handleRequest = async (logger: Logger, request: {}) => {
    if (Array.isArray(request)) {
      return Promise.all(request.map(async (batchRequest) => handleSingleRequest(logger, batchRequest)));
    }

    return handleSingleRequest(logger, request);
  };

  const handleRequestSafe = async (logger: Logger, request: {}): Promise<RPCResult | RPCResult[]> => {
    try {
      // tslint:disable-next-line prefer-immediate-return
      const result = await handleRequest(logger, request);
      // name: 'http_rpc_server_request',
      // level: { log: 'debug', span: 'info' },
      // error: {},

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
        const logger = getLogger(ctx);
        const result = await handleRequestSafe(logger, body);

        ctx.status = 200;
        ctx.body = result;
      },
    ]),
  };
};
