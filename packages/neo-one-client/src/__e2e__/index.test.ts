import * as api from '@neo-one/client';

describe('exported api', () => {
  const EXPECTED = [
    'Client',
    'ReadClient',
    'DeveloperClient',
    // ./user
    'LocalUserAccountProvider',
    'LocalKeyStore',
    'LocalMemoryStore',
    'LocalStringStore',
    'NEOONEDataProvider',
    'NEOONEProvider',
    'disassembleByteCode',
    'abi',
    // ./helpers
    'publicKeyToScriptHash',
    'publicKeyToAddress',
    'scriptHashToAddress',
    'addressToScriptHash',
    'assets',
    'wifToPrivateKey',
    'privateKeyToWIF',
    'privateKeyToScriptHash',
    'privateKeyToAddress',
    'privateKeyToPublicKey',
    'isNEP2',
    'encryptNEP2',
    'decryptNEP2',
    'createPrivateKey',
    'networks',
    // ./preconfigured
    'provider',
    'mainReadClient',
    'testReadClient',
    'createReadClient',
    'typeGuards',
  ];

  test('has expected keys', () => {
    expect(Object.keys(api).sort()).toEqual(EXPECTED.sort());
  });

  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/client');
    expect(time).toBeLessThan(900);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/client');
    expect(time).toBeLessThan(350);
  });
});
