/* @flow */
import { keys } from '../../__data__';
import publicKey from '../../converters/publicKey';

const key = keys[0];
const publicKeyBuffer = Buffer.from(key.publicKey, 'hex');

describe('publicKey', () => {
  test('converts string to public key', () => {
    expect(publicKey(key.publicKey)).toEqual(publicKeyBuffer);
  });

  test('converts buffer to private key', () => {
    expect(publicKey(publicKeyBuffer)).toEqual(publicKeyBuffer);
  });

  test('throws on other input', () => {
    try {
      // $FlowFixMe
      publicKey({});
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });
});
