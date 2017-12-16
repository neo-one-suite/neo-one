/* @flow */
import common from '../../common';
import crypto from '../../crypto';
import { keys } from '../../__data__';

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

  describe(`crypto using ${name} key`, () => {
    test('privateKeyToPublicKey', () => {
      expect(crypto.privateKeyToPublicKey(privateKey)).toEqual(publicKey);
    });

    test('publicKeyToScriptHash', () => {
      expect(crypto.publicKeyToScriptHash(publicKey)).toEqual(scriptHash);
    });

    test('scriptHashToAddress', () => {
      expect(
        crypto.scriptHashToAddress({
          addressVersion: common.NEO_ADDRESS_VERSION,
          scriptHash,
        }),
      ).toEqual(address);
    });

    test('addressToScriptHash', () => {
      expect(
        crypto.addressToScriptHash({
          addressVersion: common.NEO_ADDRESS_VERSION,
          address,
        }),
      ).toEqual(scriptHash);
    });

    test('privateKeyToWIF', () => {
      expect(
        crypto.privateKeyToWIF(privateKey, common.NEO_PRIVATE_KEY_VERSION),
      ).toEqual(wif);
    });

    test('wifToPrivateKey', () => {
      expect(
        crypto.wifToPrivateKey(wif, common.NEO_PRIVATE_KEY_VERSION),
      ).toEqual(privateKey);
    });

    test('privateKeyToScriptHash', () => {
      expect(crypto.privateKeyToScriptHash(privateKey)).toEqual(scriptHash);
    });

    test('privateKeyToAddress', () => {
      expect(
        crypto.privateKeyToAddress({
          addressVersion: common.NEO_ADDRESS_VERSION,
          privateKey,
        }),
      ).toEqual(address);
    });

    test('encryptNEP2', async () => {
      expect(
        await crypto.encryptNEP2({
          addressVersion: common.NEO_ADDRESS_VERSION,
          password,
          privateKey,
        }),
      ).toEqual(encryptedWIF);
    });

    test('decryptNEP2', async () => {
      expect(
        await crypto.decryptNEP2({
          addressVersion: common.NEO_ADDRESS_VERSION,
          password,
          encryptedKey: encryptedWIF,
        }),
      ).toEqual(privateKey);
    });

    test('createPrivateKey', () => {
      const pk = crypto.createPrivateKey();
      expect(
        crypto.wifToPrivateKey(
          crypto.privateKeyToWIF(pk, common.NEO_PRIVATE_KEY_VERSION),
          common.NEO_PRIVATE_KEY_VERSION,
        ),
      ).toEqual(pk);
      expect(
        crypto.privateKeyToAddress({
          addressVersion: common.NEO_ADDRESS_VERSION,
          privateKey: pk,
        }),
      ).toBeTruthy();
    });
  });
}
