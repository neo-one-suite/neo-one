import { common } from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { Client } from '../Client';
import { NEOONEProvider } from '../provider';
import { LocalKeyStore, LocalMemoryStore, LocalUserAccountProvider } from '../user';

describe('quick testing', () => {
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
          rpcURL: '127.0.0.1:8080/rpc',
        },
      ]),
    });
  };

  const setupClient = async () => {
    const accountProvider = await createUserAccountProvider();

    return new Client({ local: accountProvider });
  };

  test('start', async () => {
    const client = await setupClient();
    const account = client.getCurrentUserAccount();
    if (account === undefined) {
      throw new Error('for ts');
    }

    const result = await client.__call('test', common.uInt160ToString(common.nativeHashes.GAS), 'balanceOf', [
      account.id.address,
    ]);

    console.log(result);
  });
});
