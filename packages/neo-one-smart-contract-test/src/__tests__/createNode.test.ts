/// <reference types="@neo-one/build-tools/types/unit" />
import { common } from '@neo-one/client-common';
import {
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEDataProvider,
  NEOONEProvider,
} from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import { createNode } from '../createNode';

const secondaryKeyString = '04c1784140445016cf0f8cc86dd10ad8764e1a89c563c500e21ac19a5d905ab3';

describe('createNode tests', () => {
  test('can send master transfer', async () => {
    const { privateKey, node, rpcURL } = await createNode();
    one.addCleanup(async () => node.stop());

    const dataProvider = new NEOONEDataProvider({ network: 'priv', rpcURL });
    const networkName = dataProvider.network;
    const masterWalletName = 'master';

    const keystore = new LocalKeyStore(new LocalMemoryStore());
    const [masterAccount, emptyAccount] = await Promise.all([
      keystore.addMultiSigUserAccount({
        network: networkName,
        privateKeys: [privateKey],
        name: masterWalletName,
      }),
      keystore.addUserAccount({
        network: networkName,
        privateKey: secondaryKeyString,
        name: 'empty',
      }),
    ]);

    const provider = new NEOONEProvider([dataProvider]);

    const localUserAccountProvider = new LocalUserAccountProvider({
      keystore,
      provider,
    });

    const transfer = {
      to: emptyAccount.userAccount.id.address,
      asset: common.nativeScriptHashes.NEO,
      amount: new BigNumber(10),
    };

    const result = await localUserAccountProvider.transfer([transfer], {
      from: masterAccount.userAccount.id,
      maxNetworkFee: new BigNumber(-1),
      maxSystemFee: new BigNumber(-1),
    });

    await result.confirmed();

    const receipt = await localUserAccountProvider.provider.getApplicationLogData('priv', result.transaction.hash);

    const stackReturn = receipt.stack[0];
    if (typeof stackReturn === 'string') {
      throw new Error('expected good return');
    }

    expect(stackReturn.value).toEqual(true);
  });
});
