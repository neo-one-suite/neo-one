import { common, crypto, ScriptBuilder } from '@neo-one/client-common';
import { constants } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { NEOONEProvider, NEOONEDataProvider } from '../../provider';
import { LocalKeyStore, LocalMemoryStore, LocalUserAccountProvider } from '../../user';

const secondaryKeyString = '04c1784140445016cf0f8cc86dd10ad8764e1a89c563c500e21ac19a5d905ab3';

describe.skip('Test LocalUserAccountProvider transfer methods -- local network', () => {
  const config = {
    blockchain: {
      standbyValidators: ['0248be3c070df745a60f3b8b494efcc6caf90244d803a9a72fe95d9bae2120ec70'].map((p) =>
        common.stringToECPoint(p),
      ),
    },
    network: {
      rpcURL: 'http://localhost:9040/rpc',
      name: 'local',
    },
  };

  const masterAccount = {
    network: constants.LOCAL_NETWORK_NAME,
    privateKeys: [constants.PRIVATE_NET_PRIVATE_KEY],
    name: 'master',
  };

  const masterScriptHash = crypto.toScriptHash(
    crypto.createMultiSignatureVerificationScript(1, config.blockchain.standbyValidators),
  );
  const masterAddress = crypto.scriptHashToAddress({
    addressVersion: common.NEO_ADDRESS_VERSION,
    scriptHash: masterScriptHash,
  });

  const emptyKey = common.stringToPrivateKey(secondaryKeyString);
  const emptyAddress = crypto.privateKeyToAddress({ addressVersion: common.NEO_ADDRESS_VERSION, privateKey: emptyKey });

  const emptyAccount = {
    network: constants.LOCAL_NETWORK_NAME,
    privateKey: secondaryKeyString,
    name: 'empty',
  };

  test('Transfer', async () => {
    const keystore = new LocalKeyStore(new LocalMemoryStore());
    await Promise.all([keystore.addMultiSigUserAccount(masterAccount), keystore.addUserAccount(emptyAccount)]);

    const provider = new NEOONEProvider([{ network: 'local', rpcURL: config.network.rpcURL }]);

    const localProvider = new LocalUserAccountProvider({ provider, keystore });

    const transfer = {
      amount: new BigNumber(100000),
      asset: common.nativeScriptHashes.NEO,
      to: emptyAddress,
    };

    const result = await localProvider.transfer([transfer], {
      from: {
        network: 'local',
        address: masterAddress,
      },
      maxNetworkFee: new BigNumber(-1),
      maxSystemFee: new BigNumber(-1),
    });

    await result.confirmed();

    const receipt = await localProvider.provider.getApplicationLogData('local', result.transaction.hash);

    const stackReturn = receipt.stack[0];
    if (typeof stackReturn === 'string') {
      throw new Error('expected good return');
    }

    expect(stackReturn.value).toEqual(true);
  });
});

// Test the localUserAccountProvider using our test account
describe.skip('Test LocalUserAccountProvider transfer methods -- staging network', () => {
  const masterPK = '08674acb3bb23d24473f2a578cee0399e2ae9e14b5159b6f1fcbdf1a6b678422';

  const masterAccount = {
    network: 'test',
    privateKey: masterPK,
    name: 'fundAccount',
  };

  const secondaryAccount = {
    network: 'test',
    privateKey: secondaryKeyString,
    name: 'receiveAccount',
  };

  const masterAddress = crypto.privateKeyToAddress({
    privateKey: common.stringToPrivateKey(masterPK),
    addressVersion: common.NEO_ADDRESS_VERSION,
  });
  const secondaryAddress = crypto.privateKeyToAddress({
    privateKey: common.stringToPrivateKey(secondaryKeyString),
    addressVersion: common.NEO_ADDRESS_VERSION,
  });

  const providerOptions = {
    network: 'test',
    rpcURL: 'https://staging.neotracker.io/rpc',
  };

  test('Transfer', async () => {
    const keystore = new LocalKeyStore(new LocalMemoryStore());
    await Promise.all([keystore.addUserAccount(masterAccount), keystore.addUserAccount(secondaryAccount)]);

    const localProvider = new LocalUserAccountProvider({ provider: new NEOONEProvider([providerOptions]), keystore });

    const transfer = {
      amount: new BigNumber(10),
      asset: common.nativeScriptHashes.GAS,
      to: secondaryAddress,
    };

    const result = await localProvider.transfer([transfer], {
      from: {
        network: 'test',
        address: masterAddress,
      },
    });

    await result.confirmed();

    const receipt = await localProvider.provider.getApplicationLogData('local', result.transaction.hash);

    const stackReturn = receipt.stack[0];
    if (typeof stackReturn === 'string') {
      throw new Error('expected good return');
    }

    expect(stackReturn.value).toEqual(true);
  });
});

describe('contract info / usage testing', () => {
  const knownContractHashString = '0x79597a92440ce385fe1b0f4d9d2a92ca8608a575';
  const knownContractHash = common.stringToUInt160(knownContractHashString);

  const providerOptions = {
    network: 'test',
    rpcURL: 'http://localhost:8081/rpc',
  };
  const provider = new NEOONEProvider([providerOptions]);

  test('use `call` to get name of NEO contract', async () => {
    const result = await provider.call('test', common.nativeScriptHashes.NEO, 'name', []);
    const value = result.stack[0];
    if (typeof value === 'string') {
      throw new Error(value);
    }

    expect(value.value).toEqual('NEO');
  });
});
