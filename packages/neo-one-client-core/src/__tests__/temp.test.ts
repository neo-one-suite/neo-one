import { common, crypto } from '@neo-one/client-common';
import { Client } from '../Client';
import { NEOONEProvider } from '../provider';
import { LocalKeyStore, LocalMemoryStore, LocalUserAccountProvider } from '../user';

describe('Client Tests', () => {
  const createUserAccountProvider = async () => {
    const keystore = new LocalKeyStore(new LocalMemoryStore());
    await keystore.addUserAccount({
      network: 'testnet',
      privateKey: 'L4sEvTq6RDL42XGoGRQJjhLwfZ4BbwiStks9zrbLuG7yF3dXdpBZ',
      name: 'sender',
    });

    await keystore.addUserAccount({
      network: 'testnet',
      privateKey: 'L4qhHtwbiAMu1nrSmsTP5a3dJbxA3SNS6oheKnKd8E7KTJyCLcUv',
      name: 'receiver',
    });

    return new LocalUserAccountProvider({
      keystore,
      provider: new NEOONEProvider([
        {
          network: 'testnet',
          rpcURL: 'http://127.0.0.1:8080/rpc',
        },
      ]),
    });
  };

  const setupClient = async () => {
    const accountProvider = await createUserAccountProvider();

    return new Client({ local: accountProvider });
  };

  let client: Client;
  beforeEach(async () => {
    client = await setupClient();
  });

  test('__call', async () => {
    const account = client.getCurrentUserAccount();
    if (account === undefined) {
      throw new Error('for ts');
    }

    const result = await client.__call(
      'testnet',
      crypto.scriptHashToAddress({ addressVersion: common.NEO_ADDRESS_VERSION, scriptHash: common.nativeHashes.GAS }),
      'balanceOf',
      [account.id.address],
    );

    console.log(result);
  });

  test('getAccount', async () => {
    const result = await client.getAccount({ network: 'testnet', address: 'NSuX7PdXJLwUB7zboGor3X2C2eHswdM3t9' });

    console.log(result);
  });
});
