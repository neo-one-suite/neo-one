/// <reference types="@neo-one/types/e2e"/>
// tslint:disable-next-line no-implicit-dependencies
import * as api from '@neo-one/client-full';

describe('@neo-one/client-full', () => {
  const EXPECTED = [
    'Client',
    'DeveloperClient',
    'ReadClient',
    'Hash256',
    'OneClient',
    'nep5',
    // ./user
    'LocalUserAccountProvider',
    'LocalKeyStore',
    'LocalMemoryStore',
    'LocalStringStore',
    // ./provider
    'JSONRPCProvider',
    'NEOONEDataProvider',
    'NEOONEOneDataProvider',
    'NEOONEProvider',
    // ./helpers
    'addressToScriptHash',
    'createPrivateKey',
    'decryptNEP2',
    'encryptNEP2',
    'isNEP2',
    'privateKeyToAddress',
    'privateKeyToPublicKey',
    'privateKeyToScriptHash',
    'privateKeyToWIF',
    'publicKeyToAddress',
    'publicKeyToScriptHash',
    'scriptHashToAddress',
    'wifToPrivateKey',
    // DeveloperTools
    'DeveloperTools',
  ];

  test('has expected exports', () => {
    // tslint:disable-next-line no-array-mutation no-misleading-array-reverse
    expect(Object.keys(api).sort()).toEqual(EXPECTED.sort());
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/client-full');
    expect(time).toBeLessThan(2500);
  });
});
