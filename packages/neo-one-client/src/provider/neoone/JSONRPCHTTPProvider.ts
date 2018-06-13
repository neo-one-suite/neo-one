import { Monitor } from '@neo-one/monitor';
import { labels, utils } from '@neo-one/utils';
import DataLoader from 'dataloader';
import stringify from 'fast-stable-stringify';
import fetch from 'isomorphic-fetch';
import { UnknownBlockError } from '../../errors';
import { HTTPError, InvalidRPCResponseError, JSONRPCError } from './errors';
import { JSONRPCProvider, JSONRPCRequest } from './JSONRPCProvider';

const TIMEOUT_MS = 20000;
const WATCH_TIMEOUT_MS = 5000;

const PARSE_ERROR_CODE = -32700;
const PARSE_ERROR_MESSAGE = 'Parse error';

const instrumentFetch = (
  doFetch: (headers: object) => Promise<any>,
  endpoint: string,
  type: 'fetch' | 'watch',
  monitor?: Monitor,
  monitors?: Monitor[],
) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (monitor == null) {
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
        span.inject(monitor.formats.HTTP, headers);
        let status = -1;
        try {
          const resp = await doFetch(headers);
          ({ status } = resp);
          return resp;
        } finally {
          span.setLabels({ [monitor.labels.HTTP_STATUS_CODE]: status });
        }
      },
      {
        name: 'http_client_request',
        level: { log: 'verbose', span: 'info' },
        references: (monitors || [])
          .slice(1)
          .map((parent) => monitor.childOf(parent)),
        trace: true,
      },
    );
};

const request = async ({
  endpoint,
  requests,
  timeoutMS,
  tries: triesIn,
}: {
  endpoint: string;
  requests: ReadonlyArray<{ monitor?: Monitor; request: object }>;
  timeoutMS: number;
  tries: number;
}) => {
  const monitors = requests.map((req) => req.monitor).filter(utils.notNull);
  const monitor = monitors[0];
  const body = JSON.stringify(requests.map((req) => req.request));

  let tries = triesIn;
  let parseErrorTries = 3;
  let result;
  let finalError;
  while (tries >= 0) {
    try {
      // eslint-disable-next-line
      const response = await instrumentFetch(
        (headers) =>
          fetch(endpoint, {
            method: 'POST',
            headers,
            body,
            timeout: timeoutMS,
          } as any),
        endpoint,
        'fetch',
        monitor,
        monitors,
      );

      if (!response.ok) {
        let text = null;
        try {
          // eslint-disable-next-line
          text = await response.text();
        } catch (error) {
          // Ignore errors
        }
        throw new HTTPError(response.status, text);
      }
      // eslint-disable-next-line
      result = await response.json();
      if (Array.isArray(result)) {
        return result;
      } else if (
        typeof result === 'object' &&
        result.error != null &&
        typeof result.error === 'object' &&
        typeof result.error.code === 'number' &&
        typeof result.error.message === 'string'
      ) {
        if (
          result.error.code === PARSE_ERROR_CODE &&
          result.error.message === PARSE_ERROR_MESSAGE &&
          parseErrorTries > 0
        ) {
          tries += 1;
          parseErrorTries -= 1;
        } else {
          throw new JSONRPCError(result.error);
        }
      }
    } catch (error) {
      finalError = error;
    }

    tries -= 1;
  }
  if (finalError != null) {
    throw finalError;
  }

  throw new InvalidRPCResponseError();
};

const watchSingle = async ({
  endpoint,
  request: req,
  timeoutMS,
  monitor,
}: {
  endpoint: string;
  request: object;
  timeoutMS: number;
  monitor?: Monitor;
}) => {
  const response = await instrumentFetch(
    (headers) =>
      fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(req),
        timeout: timeoutMS + WATCH_TIMEOUT_MS,
      } as any),
    endpoint,
    'watch',
    monitor,
  );

  if (!response.ok) {
    let text = null;
    try {
      text = await response.text();
    } catch (error) {
      // Ignore errors
    }
    throw new HTTPError(response.status, text);
  }
  const result = await response.json();
  return result;
};

const handleResponse = (responseJSON: any): any => {
  if (responseJSON.error != null) {
    if (
      responseJSON.error.code === -100 &&
      responseJSON.error.message === 'Unknown block'
    ) {
      throw new UnknownBlockError();
    }
    throw new JSONRPCError(responseJSON.error);
  }

  return responseJSON.result;
};

export class JSONRPCHTTPProvider implements JSONRPCProvider {
  public readonly endpoint: string;
  public readonly batcher: DataLoader<{ monitor?: Monitor; request: any }, any>;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.batcher = new DataLoader(
      async (requests) => {
        this.batcher.clearAll();
        const result = await request({
          endpoint,
          requests,
          tries: 1,
          timeoutMS: TIMEOUT_MS,
        });

        return result;
      },
      {
        maxBatchSize: 25,
        cacheKeyFn: (value: any) => stringify(value.request),
      },
    );
  }

  public request(req: JSONRPCRequest, monitor?: Monitor): Promise<any> {
    if (monitor != null) {
      return monitor
        .at('jsonrpc_http_provider')
        .withLabels({
          [monitor.labels.RPC_TYPE]: 'jsonrpc',
          [monitor.labels.RPC_METHOD]: req.method,
          [monitor.labels.SPAN_KIND]: 'client',
        })
        .captureSpanLog((span) => this.requestInternal(req, span), {
          name: 'jsonrpc_client_request',
          level: { log: 'verbose', span: 'info' },
          error: { level: 'verbose' },
          trace: true,
        });
    }

    return this.requestInternal(req);
  }

  private async requestInternal(
    req: JSONRPCRequest,
    monitor?: Monitor,
  ): Promise<any> {
    let response;
    const { watchTimeoutMS } = req;
    if (watchTimeoutMS != null) {
      response = await watchSingle({
        endpoint: this.endpoint,
        request: {
          jsonrpc: '2.0',
          id: 1,
          method: req.method,
          params: (req.params || []).concat([watchTimeoutMS]),
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
          params: [],
          ...req,
        },
      });
    }

    return handleResponse(response);
  }
}
