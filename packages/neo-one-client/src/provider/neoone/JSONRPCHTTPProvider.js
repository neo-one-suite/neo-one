/* @flow */
import DataLoader from 'dataloader';
import type { Monitor } from '@neo-one/monitor';

import fetch from 'isomorphic-fetch';
import stringify from 'fast-stable-stringify';

import { HTTPError, InvalidRPCResponseError, JSONRPCError } from './errors';
import { type JSONRPCRequest, type JSONRPCProvider } from './JSONRPCProvider';
import { UnknownBlockError } from '../../errors';

const TIMEOUT_MS = 20000;
const WATCH_TIMEOUT_MS = 5000;

const PARSE_ERROR_CODE = -32700;
const PARSE_ERROR_MESSAGE = 'Parse error';

const instrumentFetch = (
  doFetch: (headers: Object) => Promise<any>,
  endpoint: string,
  type: 'fetch' | 'watch',
  monitor?: Monitor,
  monitors?: Array<Monitor>,
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
      'fetch.type': type,
    })
    .captureSpan(
      span =>
        span.captureLogSingle(
          () => {
            span.inject(monitor.formats.HTTP, headers);
            return doFetch(headers)
              .then(resp => {
                span.setLabels({
                  [monitor.labels.HTTP_STATUS_CODE]: resp.status,
                });
                return resp;
              })
              .catch(error => {
                span.setLabels({ [monitor.labels.HTTP_STATUS_CODE]: -1 });
                throw error;
              });
          },
          {
            name: 'fetch',
            message: 'Fetched from rpc',
            error: 'Failed to fetch from rpc',
            level: 'verbose',
          },
        ),
      {
        name: 'fetch',
        references: (monitors || [])
          .slice(1)
          .map(parent => monitor.childOf(parent)),
      },
    );
};

const request = async ({
  endpoint,
  requests,
  timeoutMS,
  tries: triesIn,
}: {|
  endpoint: string,
  requests: Array<{| monitor?: Monitor, request: Object |}>,
  timeoutMS: number,
  tries: number,
|}) => {
  const monitors = requests.map(req => req.monitor).filter(Boolean);
  const monitor = monitors[0];
  const body = JSON.stringify(requests.map(req => req.request));

  let tries = triesIn;
  let parseErrorTries = 3;
  let result;
  let finalError;
  while (tries >= 0) {
    try {
      // eslint-disable-next-line
      const response = await instrumentFetch(
        headers =>
          fetch(endpoint, {
            method: 'POST',
            headers,
            body,
            timeout: timeoutMS,
          }),
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
      if (!Array.isArray(result)) {
        if (
          result.error &&
          result.error.code === PARSE_ERROR_CODE &&
          result.error.message === PARSE_ERROR_MESSAGE &&
          parseErrorTries > 0
        ) {
          tries += 1;
          parseErrorTries -= 1;
        }
      } else {
        return result;
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
}: {|
  endpoint: string,
  request: Object,
  timeoutMS: number,
  monitor?: Monitor,
|}) => {
  const response = await instrumentFetch(
    headers =>
      fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(req),
        timeout: timeoutMS + WATCH_TIMEOUT_MS,
      }),
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

const handleResponse = (responseJSON: Object): any => {
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

export default class JSONRPCHTTPProvider implements JSONRPCProvider {
  endpoint: string;
  batcher: DataLoader<Object, Object>;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.batcher = new DataLoader(
      async requests => {
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
        cacheKeyFn: (value: Object) => stringify(value.request),
      },
    );
  }

  request(req: JSONRPCRequest, monitor?: Monitor): Promise<any> {
    if (monitor != null) {
      return monitor
        .at('json_rpc_http_provider')
        .withLabels({
          [monitor.labels.RPC_TYPE]: 'jsonrpc',
          [monitor.labels.RPC_METHOD]: req.method,
          [monitor.labels.SPAN_KIND]: 'client',
        })
        .captureSpan(
          span =>
            span.captureLogSingle(log => this._request(req, log), {
              name: 'request',
              message: `Sent request ${req.method}.`,
              error: `Request ${req.method} failed.`,
              level: 'verbose',
            }),
          { name: 'request' },
        );
    }

    return this._request(req);
  }

  async _request(req: JSONRPCRequest, monitor?: Monitor): Promise<any> {
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
