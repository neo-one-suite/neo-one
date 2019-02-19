import { DefaultMonitor } from '@neo-one/monitor';
import fetch from 'cross-fetch';
import { HTTPError, InvalidRPCResponseError, JSONRPCError, UnknownBlockError } from '../../errors';
import { JSONRPCHTTPProvider } from '../../provider/JSONRPCHTTPProvider';

jest.mock('cross-fetch');

describe('JSONRPCHTTPProvider', () => {
  const endpoint = 'https://neotracker.io/rpc';
  const req = { method: 'getblockcount' };
  const expectedReq = {
    jsonrpc: '2.0',
    id: 1,
    ...req,
    params: [],
  };

  let provider = new JSONRPCHTTPProvider(endpoint);
  // tslint:disable-next-line no-any
  const fetchMock: jest.Mock = fetch as any;
  beforeEach(() => {
    fetchMock.mockClear();
    provider = new JSONRPCHTTPProvider(endpoint);
  });

  test('retries failed requests once', async () => {
    const error = new Error('hello world');
    // tslint:disable-next-line:no-any
    fetchMock.mockImplementation(async () => Promise.reject(error));

    const result = provider.request(req);

    await expect(result).rejects.toEqual(error);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('retries parse error requests three additional times (total 5)', async () => {
    fetchMock.mockImplementation(async () =>
      Promise.resolve({
        ok: true,
        json: async () =>
          Promise.resolve({
            error: {
              code: -32700,
              message: 'Parse error',
            },
          }),
      }),
    );

    const result = provider.request(req);

    await expect(result).rejects.toEqual(
      new JSONRPCError({
        code: -32700,
        message: 'Parse error',
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  test('does not retry other failures additional times', async () => {
    fetchMock.mockImplementation(async () =>
      Promise.resolve({
        ok: true,
        json: async () => Promise.resolve({}),
      }),
    );

    const result = provider.request(req);

    await expect(result).rejects.toEqual(new InvalidRPCResponseError());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('retries http errors and throws error with text', async () => {
    const status = 400;
    const expected = 'error message';
    fetchMock.mockImplementation(async () =>
      Promise.resolve({
        ok: false,
        status,
        text: async () => Promise.resolve(expected),
      }),
    );

    const result = provider.request(req);

    await expect(result).rejects.toEqual(new HTTPError(status, expected));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('retries http errors and catches text errors', async () => {
    const status = 400;
    const expected = undefined;
    fetchMock.mockImplementation(async () =>
      Promise.resolve({
        ok: false,
        status,
        text: async () => Promise.reject(new Error('hello world')),
      }),
    );

    const result = provider.request(req);

    await expect(result).rejects.toEqual(new HTTPError(status, expected));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('throws UnknownBlockError', async () => {
    fetchMock.mockImplementation(async () =>
      Promise.resolve({
        ok: true,
        json: async () =>
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
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('throws JSONRPCError', async () => {
    const expected = {
      code: -500,
      message: 'Some error',
    };

    fetchMock.mockImplementation(async () =>
      Promise.resolve({
        ok: true,
        json: async () =>
          Promise.resolve([
            {
              error: expected,
            },
          ]),
      }),
    );

    const result = provider.request(req);

    await expect(result).rejects.toEqual(new JSONRPCError(expected));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('watchSingle throws http error and catches text errors', async () => {
    const reqTimeout = { method: 'getblockcount', watchTimeoutMS: 1000 };
    const status = 400;
    const expected = undefined;
    fetchMock.mockImplementation(async () =>
      Promise.resolve({
        ok: false,
        status,
        text: async () => Promise.reject(new Error('hello world')),
      }),
    );

    const result = provider.request(reqTimeout);

    await expect(result).rejects.toEqual(new HTTPError(status, expected));
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
    fetchMock.mockImplementation(async () =>
      Promise.resolve({
        ok: true,
        json: async () => Promise.resolve({ result: expected }),
      }),
    );

    const result = provider.request(reqTimeout);

    await expect(result).resolves.toBe(expected);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(expectedReqTimeout),
      timeout: 1000 + 5000,
    });
  });

  test('watchSingle successful result - monitor', async () => {
    const monitor = DefaultMonitor.create({ service: 'test' });
    const reqTimeout = { method: 'getblockcount', watchTimeoutMS: 1000 };
    const expectedReqTimeout = {
      jsonrpc: '2.0',
      id: 1,
      method: reqTimeout.method,
      params: [reqTimeout.watchTimeoutMS],
    };

    const expected = {};
    fetchMock.mockImplementation(async () =>
      Promise.resolve({
        ok: true,
        json: async () => Promise.resolve({ result: expected }),
      }),
    );

    const result = provider.request(reqTimeout, monitor);

    await expect(result).resolves.toBe(expected);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(endpoint, {
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
    fetchMock.mockImplementation(async () =>
      Promise.resolve({
        ok: true,
        json: async () => Promise.resolve([{ result: expected }]),
      }),
    );

    const results = Promise.all([provider.request(req), provider.request(req), provider.request(req)]);

    await expect(results.then((res) => res[0])).resolves.toBe(expected);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify([expectedReq]),
      timeout: 20000,
    });
  });
});
