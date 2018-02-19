/* @flow */
import fetch from 'isomorphic-fetch';

import JSONRPCHTTPProvider from '../../../provider/neoone/JSONRPCHTTPProvider';

import {
  HTTPError,
  InvalidRPCResponseError,
  JSONRPCError,
} from '../../../provider/neoone/errors';
import { UnknownBlockError } from '../../../errors';

jest.mock('isomorphic-fetch');

describe('JSONRPCHTTPProvider', () => {
  const endpoint = 'foobar';
  const req = { method: 'getblockcount' };
  const expectedReq = {
    jsonrpc: '2.0',
    id: 1,
    params: [],
    ...req,
  };

  let provider = new JSONRPCHTTPProvider(endpoint);
  beforeEach(() => {
    fetch.mockClear();
    provider = new JSONRPCHTTPProvider(endpoint);
  });

  test('retries failed requests once', async () => {
    const error = new Error('hello world');
    fetch.mockImplementation(() => Promise.reject(error));

    const result = provider.request(req);

    await expect(result).rejects.toEqual(error);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('retries parse error requests three additional times', async () => {
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            error: {
              code: -32700,
              message: 'Parse error',
            },
          }),
      }),
    );

    const result = provider.request(req);

    await expect(result).rejects.toEqual(new InvalidRPCResponseError());
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  test('does not retry other responses additional times', async () => {
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    const result = provider.request(req);

    await expect(result).rejects.toEqual(new InvalidRPCResponseError());
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('retries http errors and throws error with text', async () => {
    const status = 400;
    const expected = 'foobar';
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status,
        text: () => Promise.resolve(expected),
      }),
    );

    const result = provider.request(req);

    await expect(result).rejects.toEqual(new HTTPError(status, expected));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('retries http errors and catches text errors', async () => {
    const status = 400;
    const expected = undefined;
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status,
        text: () => Promise.reject(new Error('hello world')),
      }),
    );

    const result = provider.request(req);

    await expect(result).rejects.toEqual(new HTTPError(status, expected));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('throws UnknownBlockError', async () => {
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              error: {
                code: -100,
                message: 'Unknown block',
              },
            },
          ]),
      }),
    );

    const result = provider.request(req);

    await expect(result).rejects.toEqual(new UnknownBlockError());
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('throws JSONRPCError', async () => {
    const expected = {
      code: -500,
      message: 'Some error',
    };
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              error: expected,
            },
          ]),
      }),
    );

    const result = provider.request(req);

    await expect(result).rejects.toEqual(new JSONRPCError(expected));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('watchSingle throws http error and catches text errors', async () => {
    const reqTimeout = { method: 'getblockcount', watchTimeoutMS: 1000 };
    const status = 400;
    const expected = undefined;
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status,
        text: () => Promise.reject(new Error('hello world')),
      }),
    );

    const result = provider.request(reqTimeout);

    await expect(result).rejects.toEqual(new HTTPError(status, expected));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('watchSingle successful result', async () => {
    const reqTimeout = { method: 'getblockcount', watchTimeoutMS: 1000 };
    const expectedReqTimeout = {
      jsonrpc: '2.0',
      id: 1,
      method: reqTimeout.method,
      params: [reqTimeout.watchTimeoutMS],
    };
    const expected = {};

    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result: expected }),
      }),
    );

    const result = provider.request(reqTimeout);

    await expect(result).resolves.toBe(expected);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expectedReqTimeout),
      timeout: 1000 + 5000,
    });
  });

  test('returns successful result', async () => {
    const expected = {};
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ result: expected }]),
      }),
    );

    const results = Promise.all([
      provider.request(req),
      provider.request(req),
      provider.request(req),
    ]);

    await expect(results.then(res => res[0])).resolves.toBe(expected);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([expectedReq]),
      timeout: 20000,
    });
  });
});
