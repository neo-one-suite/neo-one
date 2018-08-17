import { addKeysToCrypto, keys } from '../__data__';
import * as helpers from '../helpers';

describe('helpers', () => {
  addKeysToCrypto();

  test('publicKeyToScriptHash', () => {
    expect(helpers.publicKeyToScriptHash(keys[0].publicKeyString)).toEqual(keys[0].scriptHashString);
  });

  test('publicKeyToAddress', () => {
    expect(helpers.publicKeyToAddress(keys[0].publicKeyString)).toEqual(keys[0].address);
  });

  test('scriptHashToAddress', () => {
    expect(helpers.scriptHashToAddress(keys[0].scriptHashString)).toEqual(keys[0].address);
  });

  test('addressToScriptHash', () => {
    expect(helpers.addressToScriptHash(keys[0].address)).toEqual(keys[0].scriptHashString);
  });

  test('wifToPrivateKey', () => {
    expect(helpers.wifToPrivateKey(keys[0].wif)).toEqual(keys[0].privateKeyString);
  });

  test('privateKeyToWIF', () => {
    expect(helpers.privateKeyToWIF(keys[0].privateKeyString)).toEqual(keys[0].wif);
  });

  test('privateKeyToScriptHash', () => {
    expect(helpers.privateKeyToScriptHash(keys[0].privateKeyString)).toEqual(keys[0].scriptHashString);
  });

  test('privateKeyToAddress', () => {
    expect(helpers.privateKeyToAddress(keys[0].privateKeyString)).toEqual(keys[0].address);
  });

  test('privateKeyToPublicKey', () => {
    expect(helpers.privateKeyToPublicKey(keys[0].privateKeyString)).toEqual(keys[0].publicKeyString);
  });

  test('isNEP2 - false', () => {
    expect(helpers.isNEP2(keys[0].privateKeyString)).toBeFalsy();
  });

  test('isNEP2 - true', () => {
    expect(helpers.isNEP2(keys[0].encryptedWIF)).toBeTruthy();
  });

  test('encryptNEP2', async () => {
    const result = await helpers.encryptNEP2({ password: keys[0].password, privateKey: keys[0].privateKeyString });

    expect(result).toEqual(keys[0].encryptedWIF);
  });

  test('decryptNEP2', async () => {
    const result = await helpers.decryptNEP2({ password: keys[0].password, encryptedKey: keys[0].encryptedWIF });

    expect(result).toEqual(keys[0].privateKeyString);
  });

  test('createPrivateKey', () => {
    expect(helpers.createPrivateKey()).toBeDefined();
  });
});
