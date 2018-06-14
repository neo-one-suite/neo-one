import * as api from '../';

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
  ];

  test('has expected keys', () => {
    expect(Object.keys(api).sort()).toEqual(EXPECTED.sort());
  });
});
