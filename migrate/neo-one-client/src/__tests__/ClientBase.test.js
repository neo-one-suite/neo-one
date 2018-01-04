/* @flow */
/* eslint-disable no-loop-func */
import { common } from '@neo-one/client-core';

import ClientBase from '../ClientBase';

import { keys } from '../__data__';

let client = new ClientBase();
beforeEach(() => {
  client = new ClientBase({
    addressVersion: common.NEO_ADDRESS_VERSION,
    privateKeyVersion: common.NEO_PRIVATE_KEY_VERSION,
  });
});

for (const key of keys) {
  const {
    address,
    privateKey,
    publicKey,
    wif,
    password,
    encryptedWIF,
    scriptHash,
    name,
  } = key;

  describe(`ClientBase conversions using ${name} key`, () => {
    test('publicKeyToScriptHash', () => {
      expect(client.publicKeyToScriptHash(publicKey)).toEqual(scriptHash);
    });

    test('publicKeyToAddress', () => {
      expect(client.publicKeyToAddress(publicKey)).toEqual(address);
    });

    test('scriptHashToAddress', () => {
      expect(client.scriptHashToAddress(scriptHash)).toEqual(address);
    });

    test('addressToScriptHash', () => {
      expect(client.addressToScriptHash(address)).toEqual(scriptHash);
    });

    test('wifToPrivateKey', () => {
      expect(client.wifToPrivateKey(wif)).toEqual(privateKey);
    });

    test('privateKeyToWIF', () => {
      expect(client.privateKeyToWIF(privateKey)).toEqual(wif);
    });

    test('privateKeyToScriptHash', () => {
      expect(client.privateKeyToScriptHash(privateKey)).toEqual(scriptHash);
    });

    test('privateKeyToAddress', () => {
      expect(client.privateKeyToAddress(privateKey)).toEqual(address);
    });

    test('privateKeyToPublicKey', () => {
      expect(client.privateKeyToPublicKey(privateKey)).toEqual(publicKey);
    });

    test('encryptNEP2', async () => {
      const encrypted = await client.encryptNEP2({
        password,
        privateKey: wif,
      });
      expect(encrypted).toEqual(encryptedWIF);
    });

    test('decryptNEP2', async () => {
      const decrypted = await client.decryptNEP2({
        password,
        encryptedKey: encryptedWIF,
      });
      expect(decrypted).toEqual(wif);
    });
  });

  test('createPrivateKey', () => {
    const pk = client.createPrivateKey();
    expect(client.wifToPrivateKey(client.privateKeyToWIF(pk))).toEqual(
      client.wifToPrivateKey(pk),
    );
    expect(client.privateKeyToAddress(pk)).toBeTruthy();
  });
}
