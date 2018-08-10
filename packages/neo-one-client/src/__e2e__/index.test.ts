import * as api from '@neo-one/client';

describe('@neo-one/client', () => {
  const EXPECTED = [
    'Client',
    'ReadClient',
    'DeveloperClient',
    'abi',
    'assets',
    'typeGuards',
    // ./user
    'LocalUserAccountProvider',
    'LocalKeyStore',
    'LocalMemoryStore',
    'LocalStringStore',
    // ./provider
    'NEOONEDataProvider',
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
    // ./preconfigured
    'createClient',
    'createReadClient',
  ];

  test('has expected exports', () => {
    expect(Object.keys(api).sort()).toEqual(EXPECTED.sort());
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/client');
    expect(time).toBeLessThan(1300);
  });
});
