/* @flow */
import ClientBase from '../../ClientBase';

import { keys } from '../../__data__';
import privateKey from '../../converters/privateKey';

const { wif, privateKey: privateKeyString, privateKeyBuffer } = keys[0];

let client = new ClientBase();
beforeEach(() => {
  client = new ClientBase();
});

describe('privateKey', () => {
  test('converts WIF to private key', () => {
    expect(privateKey(client, wif)).toEqual(privateKeyBuffer);
  });

  test('converts string to private key', () => {
    expect(privateKey(client, privateKeyString)).toEqual(privateKeyBuffer);
  });

  test('converts buffer to private key', () => {
    expect(privateKey(client, privateKeyBuffer)).toEqual(privateKeyBuffer);
  });

  test('throws on other input', () => {
    try {
      // $FlowFixMe
      privateKey(client, {});
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });
});
