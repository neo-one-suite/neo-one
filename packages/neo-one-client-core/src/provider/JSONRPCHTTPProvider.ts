import { addAttributesToSpan, Span, SpanKind, tracer } from '@neo-one/client-switch';
import { Labels } from '@neo-one/utils';
// tslint:disable-next-line match-default-export-name
import _fetch from 'cross-fetch';
import DataLoader from 'dataloader';
import debug from 'debug';
import stringify from 'safe-stable-stringify';
import { HTTPError, InvalidRPCResponseError, JSONRPCError } from '../errors';
import { AbortController } from './AbortController.ponyfill';
import { JSONRPCProvider, JSONRPCRequest } from './JSONRPCProvider';

const logger = debug('NEOONE:JSONRPCProvider');

const TIMEOUT_MS = 20000;
const WATCH_TIMEOUT_MS = 5000;

const PARSE_ERROR_CODE = -32700;
const PARSE_ERROR_MESSAGE = 'Parse error';

const getWaitTime = (response: Response) => {
  const resetTimeout = response.headers.get('Retry-After');

  return resetTimeout !== null ? Math.max(Number(resetTimeout), 1) + 2 : 2;
};

const browserFetch = async (input: RequestInfo, init: RequestInit, timeoutMS: number): Promise<Response> => {
  const controller = new AbortController();

  const responsePromise = _fetch(input, {
    ...init,
    // tslint:disable-next-line no-any
    signal: controller.signal as any,
  });

  const timeout = setTimeout(() => controller.abort(), timeoutMS);

  try {
    // tslint:disable-next-line prefer-immediate-return
    const response = await responsePromise;

    // tslint:disable-next-line:no-var-before-return
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

const nodeFetch = async (input: RequestInfo, init: RequestInit, timeoutMS: number): Promise<Response> =>
  _fetch(input, {
    ...init,
    timeout: timeoutMS,
    // tslint:disable-next-line no-any
  } as any);

// tslint:disable-next-line strict-type-predicates
const fetch = typeof window === 'undefined' ? nodeFetch : browserFetch;

const instrumentFetch = async <T extends { readonly status: number }>(
  doFetch: (headers: Record<string, string>) => Promise<T>,
  endpoint: string,
  type: 'fetch' | 'watch',
  span: Span,
) => {
  // tslint:disable-next-line: no-any
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const labels = {
    [Labels.HTTP_URL]: endpoint,
    [Labels.HTTP_METHOD]: 'POST',
    [Labels.JSONRPC_TYPE]: type,
  };

  addAttributesToSpan(span, labels);

  try {
    if (tracer.active) {
      tracer.propagation.inject(
        {
          setHeader: (name: string, value: string) => {
            // tslint:disable-next-line: no-object-mutation
            headers[name] = value;
          },
        },
        span.spanContext,
      );
    }

    let status = -1;
    try {
      const resp = await doFetch(headers);
      status = resp.status;
      logger('%o', { level: 'debug', title: 'http_client_request', ...labels });

      return resp;
    } finally {
      span.addAttribute(Labels.HTTP_STATUS_CODE, status);
    }
  } catch (error) {
    logger('%o', { level: 'error', title: 'http_client_request', ...labels, error: error.message });
    throw error;
  }
};

const doRequest = async ({
  endpoint,
  requests,
  timeoutMS,
  tries,
}: {
  readonly endpoint: string;
  readonly requests: ReadonlyArray<{ readonly span: Span; readonly request: object }>;
  readonly timeoutMS: number;
  readonly tries: number;
}) => {
  const body = JSON.stringify(requests.map((req) => req.request));
  const span = requests[0].span;

  let remainingTries = tries;
  let parseErrorTries = 3;
  let rateLimitTimeout: number | undefined;
  let result;
  let finalError: Error | undefined;
  // tslint:disable-next-line no-loop-statement
  while (remainingTries >= 0) {
    try {
      if (rateLimitTimeout !== undefined) {
        const sleepTime = rateLimitTimeout;
        rateLimitTimeout = undefined;
        finalError = undefined;
        await new Promise<void>((resolve) => setTimeout(resolve, sleepTime * 1000));
      }
      const response = await instrumentFetch(
        async (headers) =>
          fetch(
            endpoint,
            {
              method: 'POST',
              headers,
              body,
            },
            timeoutMS,
          ),
        endpoint,
        'fetch',
        span,
      );

      if (!response.ok) {
        let text;
        try {
          text = await response.text();
        } catch {
          // Ignore errors
        }
        if (response.status === 429) {
          rateLimitTimeout = getWaitTime(response);
        }
        throw new HTTPError(response.status, text);
      }

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
  span,
}: {
  readonly endpoint: string;
  readonly req: object;
  readonly timeoutMS: number;
  readonly span: Span;
  // tslint:disable-next-line: no-any
}): Promise<any> => {
  const response = await instrumentFetch(
    async (headers) =>
      fetch(
        endpoint,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(req),
        },
        timeoutMS + WATCH_TIMEOUT_MS,
      ),
    endpoint,
    'watch',
    span,
  );

  if (!response.ok) {
    let text: string | undefined;
    try {
      text = await response.text();
    } catch {
      // Ignore errors
    }
    if (response.status === 429) {
      await new Promise<void>((resolve) => setTimeout(resolve, getWaitTime(response) * 1000));

      return watchSingle({
        endpoint,
        req,
        timeoutMS,
        span,
      });
    }
    throw new HTTPError(response.status, text);
  }

  return response.json();
};

/**
 * Implements the `JSONRPCProvider` interface using http requests.
 */
export class JSONRPCHTTPProvider extends JSONRPCProvider {
  public readonly endpoint: string;
  // tslint:disable-next-line no-any
  public readonly batcher: DataLoader<{ readonly span: Span; readonly request: any }, any>;

  public constructor(endpoint: string) {
    super();
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
  public async request(req: JSONRPCRequest): Promise<any> {
    const labels = {
      [Labels.RPC_TYPE]: 'jsonrpc',
      [Labels.RPC_METHOD]: req.method,
      [Labels.SPAN_KIND]: 'client',
    };

    return tracer.startRootSpan({ name: 'json_rpc_client_request', kind: SpanKind.CLIENT }, async (span) => {
      addAttributesToSpan(span, labels);

      try {
        const result = await this.requestInternal(req, span);
        logger({ level: 'debug', title: 'jsonrpc_client_request', ...labels });

        return result;
      } catch (error) {
        logger({ level: 'error', title: 'jsonrpc_client_request', ...labels, error: error.message });

        throw error;
      } finally {
        span.end();
      }
    });
  }

  // tslint:disable-next-line no-any
  private async requestInternal(req: JSONRPCRequest, span: Span): Promise<any> {
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
        span,
        timeoutMS: watchTimeoutMS,
      });
    } else {
      response = await this.batcher.load({
        span,
        request: {
          jsonrpc: '2.0',
          id: 1,
          method: req.method,
          params,
        },
      });
    }

    return this.handleResponse(response);
  }
}
