/* @flow */
import * as preconfigured from '../preconfigured';
import { NEOONEDataProvider, NEOONEProvider } from '../provider';
import ReadClient from '../ReadClient';

import * as networks from '../networks';

describe('preconfigured', () => {
  const fakeRPC = 'fakeRPC';
  const fakeNetwork = 'fakeNet';

  test('provider', () => {
    const expected = new NEOONEProvider({});

    const result = preconfigured.provider();
    expect(JSON.stringify(result)).toEqual(JSON.stringify(expected));
  });

  test('mainReadClient - no options', () => {
    const expected = new ReadClient(
      new NEOONEDataProvider({
        network: networks.MAIN,
        rpcURL: networks.MAIN_URL,
      }),
    );

    const result = preconfigured.mainReadClient();
    expect(JSON.stringify(result)).toEqual(JSON.stringify(expected));
  });

  test('mainReadClient - options', () => {
    const expected = new ReadClient(
      new NEOONEDataProvider({
        network: networks.MAIN,
        rpcURL: fakeRPC,
      }),
    );

    const result = preconfigured.mainReadClient({ rpcURL: fakeRPC });
    expect(JSON.stringify(result)).toEqual(JSON.stringify(expected));
  });

  test('testReadClient - no options', () => {
    const expected = new ReadClient(
      new NEOONEDataProvider({
        network: networks.TEST,
        rpcURL: networks.TEST_URL,
      }),
    );

    const result = preconfigured.testReadClient();
    expect(JSON.stringify(result)).toEqual(JSON.stringify(expected));
  });

  test('testReadClient - options', () => {
    const expected = new ReadClient(
      new NEOONEDataProvider({
        network: networks.TEST,
        rpcURL: fakeRPC,
      }),
    );

    const result = preconfigured.testReadClient({ rpcURL: fakeRPC });
    expect(JSON.stringify(result)).toEqual(JSON.stringify(expected));
  });

  test('createReadClient', () => {
    const expected = new ReadClient(
      new NEOONEDataProvider({
        network: fakeNetwork,
        rpcURL: fakeRPC,
      }),
    );

    const result = preconfigured.createReadClient({
      network: fakeNetwork,
      rpcURL: fakeRPC,
    });
    expect(JSON.stringify(result)).toEqual(JSON.stringify(expected));
  });
});
