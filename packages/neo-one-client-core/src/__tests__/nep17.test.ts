// tslint:disable no-object-mutation no-any
import { common } from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { data, factory } from '../__data__';
import { Client } from '../Client';
import * as nep17 from '../nep17';
import { NEOONEDataProvider, NEOONEProvider } from '../provider';
import { LocalKeyStore, LocalMemoryStore, LocalUserAccountProvider } from '../user';
describe('nep17', () => {
  test('abi', () => {
    expect(nep17.abi(4, true)).toMatchSnapshot();
  });

  const smartContract: { decimals?: () => BigNumber } = {};
  const clientSmartContract = jest.fn(() => smartContract);
  const client: Client = {
    smartContract: clientSmartContract,
  } as any;

  test('getDecimals', async () => {
    smartContract.decimals = jest.fn(() => data.bigNumbers.a);

    const result = await nep17.getDecimals(client, factory.createSmartContractDefinition().networks, 'main', true);

    expect(result).toEqual(data.bigNumbers.a.toNumber());
  });

  test('createNEP17SmartContract', () => {
    const contract = nep17.createNEP17SmartContract(client, factory.createSmartContractDefinition().networks, 8, true);

    expect(contract).toEqual(smartContract);
    expect(clientSmartContract.mock.calls).toMatchSnapshot();
  });

  test.only('nep17 with native contracts GAS', async () => {
    const myClient = new Client({
      memory: new LocalUserAccountProvider({
        keystore: new LocalKeyStore(new LocalMemoryStore()),
        provider: new NEOONEProvider([
          new NEOONEDataProvider({ network: 'main', rpcURL: 'http://localhost:8080/rpc' }),
        ]),
      }),
    });
    const gasNetwork = { main: { address: common.nativeScriptHashes.GAS } };
    const gas = nep17.createNEP17SmartContract(myClient, gasNetwork, 8, false);

    const [symbol, totalSupply] = await Promise.all([gas.symbol(), gas.totalSupply()]);
    console.log(symbol, totalSupply.toString());
  });

  test.only('nep17 with NEO', async () => {
    const myClient = new Client({
      memory: new LocalUserAccountProvider({
        keystore: new LocalKeyStore(new LocalMemoryStore()),
        provider: new NEOONEProvider([
          new NEOONEDataProvider({ network: 'main', rpcURL: 'http://localhost:8080/rpc' }),
        ]),
      }),
    });
    const neoNetwork = { main: { address: common.nativeScriptHashes.NEO } };
    const neo = nep17.createNEP17SmartContract(myClient, neoNetwork, 0, false);

    const [symbol, totalSupply] = await Promise.all([neo.symbol(), neo.totalSupply()]);
    console.log(symbol, totalSupply.toString());
  });
});
