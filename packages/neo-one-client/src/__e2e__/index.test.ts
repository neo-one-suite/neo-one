// tslint:disable-next-line no-implicit-dependencies
import * as api from '@neo-one/client';

describe('@neo-one/client', () => {
  const EXPECTED = [
    'Client',
    'DeveloperClient',
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
  ];

  test('has expected exports', () => {
    // tslint:disable-next-line no-array-mutation no-misleading-array-reverse
    expect(Object.keys(api).sort()).toEqual(EXPECTED.sort());
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/client');
    expect(time).toBeLessThan(2500);
  });
});
