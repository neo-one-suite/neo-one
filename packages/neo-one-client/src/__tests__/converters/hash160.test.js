/* @flow */
import ClientBase from '../../ClientBase';

import hash160 from '../../converters/hash160';
import { keys } from '../../__data__';

const { address, scriptHash, scriptHashBuffer } = keys[0];
let client = new ClientBase();
beforeEach(() => {
  client = new ClientBase();
});

describe('hash160', () => {
  test('converts address to script hash', () => {
    expect(hash160(client, address)).toEqual(scriptHashBuffer);
  });

  test('converts string to script hash', () => {
    expect(hash160(client, scriptHash)).toEqual(scriptHashBuffer);
  });

  test('converts buffer to script hash', () => {
    expect(hash160(client, scriptHashBuffer)).toEqual(scriptHashBuffer);
  });

  test('throws on other input', () => {
    try {
      // $FlowFixMe
      hash160(client, {});
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });
});
