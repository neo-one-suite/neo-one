import { Monitor } from '@neo-one/monitor';
import { labels, utils } from '@neo-one/utils';
// tslint:disable-next-line match-default-export-name
import _fetch from 'cross-fetch';
import DataLoader from 'dataloader';
import stringify from 'fast-stable-stringify';
import { UnknownBlockError } from '../../errors';
import { HTTPError, InvalidRPCResponseError, JSONRPCError } from './errors';
import { JSONRPCProvider, JSONRPCRequest } from './JSONRPCProvider';

const TIMEOUT_MS = 20000;
const WATCH_TIMEOUT_MS = 5000;

const PARSE_ERROR_CODE = -32700;
const PARSE_ERROR_MESSAGE = 'Parse error';

const instrumentFetch = async <T extends { readonly status: number }>(
  doFetch: (headers: object) => Promise<T>,
  endpoint: string,
  type: 'fetch' | 'watch',
  monitor?: Monitor,
  monitors: ReadonlyArray<Monitor> = [],
) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (monitor === undefined) {
    return doFetch(headers);
  }

  return monitor
    .withLabels({
      [monitor.labels.HTTP_URL]: endpoint,
      [monitor.labels.HTTP_METHOD]: 'POST',
      [labels.JSONRPC_TYPE]: type,
    })
    .captureSpanLog(
      async (span) => {
        // tslint:disable-next-line no-any
        span.inject(monitor.formats.HTTP, headers as any);
        let status = -1;
        try {
          const resp = await doFetch(headers);
          status = resp.status;

          return resp;
        } finally {
          span.setLabels({ [monitor.labels.HTTP_STATUS_CODE]: status });
        }
      },
      {
        name: 'http_client_request',
        level: { log: 'verbose', span: 'info' },
        references: monitors.slice(1).map((parent) => monitor.childOf(parent)),
        trace: true,
      },
    );
};

const doRequest = async ({
  endpoint,
  requests,
  timeoutMS,
  tries,
}: {
  readonly endpoint: string;
  readonly requests: ReadonlyArray<{ readonly monitor?: Monitor; readonly request: object }>;
  readonly timeoutMS: number;
  readonly tries: number;
}) => {
  const monitors = requests.map((req) => req.monitor).filter(utils.notNull);
  const monitor = monitors[0];
  const body = JSON.stringify(requests.map((req) => req.request));

  let remainingTries = tries;
  let parseErrorTries = 3;
  let result;
  let finalError: Error | undefined;
  // tslint:disable-next-line no-loop-statement
  while (remainingTries >= 0) {
    try {
      const response = await instrumentFetch(
        async (headers) =>
          _fetch(endpoint, {
            method: 'POST',
            headers,
            body,
            timeout: timeoutMS,
            // tslint:disable-next-line no-any
          } as any),
        endpoint,
        'fetch',
        monitor,
        monitors,
      );

      if (!response.ok) {
        let text;
        try {
          // eslint-disable-next-line
          text = await response.text();
        } catch {
          // Ignore errors
        }
        throw new HTTPError(response.status, text);
      }
      // eslint-disable-next-line
      result = await response.json();
      if (Array.isArray(result)) {
        return result;
      }

      if (
        typeof result === 'object' &&
        result.error !== undefined &&
        typeof result.error === 'object' &&
        typeof result.error.code === 'number' &&
        typeof result.error.message === 'string'
      ) {
        if (
          result.error.code === PARSE_ERROR_CODE &&
          result.error.message === PARSE_ERROR_MESSAGE &&
          parseErrorTries > 0
        ) {
          remainingTries += 1;
          parseErrorTries -= 1;
        } else {
          throw new JSONRPCError(result.error);
        }
      }
    } catch (error) {
      finalError = error;
    }

    remainingTries -= 1;
  }
  if (finalError !== undefined) {
    throw finalError;
  }

  throw new InvalidRPCResponseError();
};

const watchSingle = async ({
  endpoint,
  req,
  timeoutMS,
  monitor,
}: {
  readonly endpoint: string;
  readonly req: object;
  readonly timeoutMS: number;
  readonly monitor?: Monitor;
}) => {
  const response = await instrumentFetch(
    async (headers) =>
      _fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(req),
        timeout: timeoutMS + WATCH_TIMEOUT_MS,
        // tslint:disable-next-line no-any
      } as any),
    endpoint,
    'watch',
    monitor,
  );

  if (!response.ok) {
    let text: string | undefined;
    try {
      text = await response.text();
    } catch {
      // Ignore errors
    }
    throw new HTTPError(response.status, text);
  }

  return response.json();
};

// tslint:disable-next-line no-any
const handleResponse = (responseJSON: any): any => {
  if (responseJSON.error !== undefined) {
    if (responseJSON.error.code === -100 && responseJSON.error.message === 'Unknown block') {
      throw new UnknownBlockError();
    }
    throw new JSONRPCError(responseJSON.error);
  }

  return responseJSON.result;
};

export class JSONRPCHTTPProvider implements JSONRPCProvider {
  public readonly endpoint: string;
  // tslint:disable-next-line no-any
  public readonly batcher: DataLoader<{ readonly monitor?: Monitor; readonly request: any }, any>;

  public constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.batcher = new DataLoader(
      async (requests) => {
        this.batcher.clearAll();

        return doRequest({
          endpoint,
          requests,
          tries: 1,
          timeoutMS: TIMEOUT_MS,
        });
      },
      {
        maxBatchSize: 25,
        cacheKeyFn: (value) => stringify(value.request),
      },
    );
  }

  // tslint:disable-next-line no-any
  public async request(req: JSONRPCRequest, monitor?: Monitor): Promise<any> {
    if (monitor !== undefined) {
      return monitor
        .at('jsonrpc_http_provider')
        .withLabels({
          [monitor.labels.RPC_TYPE]: 'jsonrpc',
          [monitor.labels.RPC_METHOD]: req.method,
          [monitor.labels.SPAN_KIND]: 'client',
        })
        .captureSpanLog(async (span) => this.requestInternal(req, span), {
          name: 'jsonrpc_client_request',
          level: { log: 'verbose', span: 'info' },
          error: { level: 'verbose' },
          trace: true,
        });
    }

    return this.requestInternal(req);
  }

  // tslint:disable-next-line no-any
  private async requestInternal(req: JSONRPCRequest, monitor?: Monitor): Promise<any> {
    let response;
    const { watchTimeoutMS, params = [] } = req;
    if (watchTimeoutMS !== undefined) {
      response = await watchSingle({
        endpoint: this.endpoint,
        req: {
          jsonrpc: '2.0',
          id: 1,
          method: req.method,
          params: params.concat([watchTimeoutMS]),
        },

        timeoutMS: watchTimeoutMS,
        monitor,
      });
    } else {
      response = await this.batcher.load({
        monitor,
        request: {
          jsonrpc: '2.0',
          id: 1,
          method: req.method,
          params,
        },
      });
    }

    return handleResponse(response);
  }
}
