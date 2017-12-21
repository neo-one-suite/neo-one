/* @flow */
// flowlint unclear-type:off
// flowlint untyped-import:off
import DataLoader from 'dataloader';

import fetch from 'isomorphic-fetch';
import stringify from 'fast-stable-stringify';

import { HTTPError, InvalidRPCResponseError, JSONRPCError } from './errors';
import { type JSONRPCRequest, type JSONRPCProvider } from './JSONRPCProvider';
import { UnknownBlockError } from '../../errors';

const TIMEOUT_MS = 20000;

const PARSE_ERROR_CODE = -32700;
const PARSE_ERROR_MESSAGE = 'Parse error';

const request = async ({
  endpoint,
  requests,
  timeoutMS,
  tries: triesIn,
}: {|
  endpoint: string,
  requests: Array<Object>,
  timeoutMS: number,
  tries: number,
|}) => {
  let tries = triesIn;
  let parseErrorTries = 3;
  let result;
  let finalError;
  while (tries >= 0) {
    try {
      // eslint-disable-next-line
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requests),
        timeout: timeoutMS,
      });
      if (!response.ok) {
        let text = null;
        try {
          // eslint-disable-next-line
          text = await response.text();
        } catch (error) {
          // eslint-disable-next-line
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
}: {|
  endpoint: string,
  request: Object,
  timeoutMS: number,
|}) => {
  // eslint-disable-next-line
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
    timeout: timeoutMS,
  });
  if (!response.ok) {
    let text = null;
    try {
      // eslint-disable-next-line
      text = await response.text();
    } catch (error) {
      // eslint-disable-next-line
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
        cacheKeyFn: (value: Object) => stringify(value),
      },
    );
  }

  async request(req: JSONRPCRequest): Promise<any> {
    let response;
    const { watchTimeoutMS } = req;
    if (watchTimeoutMS != null) {
      response = await watchSingle({
        endpoint: this.endpoint,
        request: {
          method: req.method,
          params: (req.params || []).concat({
            type: 'watch',
            timeoutMS: watchTimeoutMS,
          }),
        },
        timeoutMS: watchTimeoutMS,
      });
    } else {
      response = await this.batcher.load({
        jsonrpc: '2.0',
        id: 1,
        params: [],
        ...req,
      });
    }

    return handleResponse(response);
  }
}
