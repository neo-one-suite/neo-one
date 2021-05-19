import { common } from '@neo-one/client-common';
import {
  AddChange,
  DeleteChange,
  Nep17Balance,
  Nep17BalanceKey,
  Storage,
  StorageItem,
  StorageKey,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import LevelUp from 'levelup';
import MemDown from 'memdown';
import { storage as levelUpStorage } from '../';

describe('levelUpStorage', () => {
  let storage: Storage;
  beforeEach(async () => {
    storage = levelUpStorage({ db: LevelUp(MemDown()), context: { network: 1953787457, validatorsCount: 7 } });
  });
  test('deleted items are undefined', async () => {
    const hash = common.bufferToUInt160(Buffer.from('3775292229eccdf904f16fff8e83e7cffdc0f0ce', 'hex'));
    const key = new StorageKey({ id: 20, key: hash });
    const value = Buffer.from('5f8d70', 'hex');

    const firstGet = await storage.storages.tryGet(key);
    expect(firstGet).toEqual(undefined);

    const storageItem = new StorageItem({
      value,
    });
    const addChange: AddChange = {
      type: 'storage',
      key,
      value: storageItem,
    };

    await storage.commit([{ type: 'add', change: addChange, subType: 'add' }]);
    const secondGet = await storage.storages.tryGet(key);
    expect(JSON.stringify(secondGet)).toEqual(JSON.stringify(storageItem));

    const deleteChange: DeleteChange = {
      type: 'storage',
      key,
    };

    await storage.commit([{ type: 'delete', change: deleteChange }]);

    const thirdGet = await storage.storages.tryGet(key);
    expect(thirdGet).toEqual(undefined);
  });

  test('Can add and retrieve Nep17Balance', async () => {
    const value = new Nep17Balance({ balanceBuffer: new BN(10).toBuffer('le'), lastUpdatedBlock: 1 });
    const key = new Nep17BalanceKey({
      userScriptHash: common.bufferToUInt160(Buffer.from('3775292229eccdf904f16fff8e83e7cffdc0f0ce', 'hex')),
      assetScriptHash: common.bufferToUInt160(Buffer.from('3775292229eccdf904f16fff8e83e7cffdc0f0ce', 'hex')),
    });

    const addChange: AddChange = {
      type: 'nep17Balance',
      key,
      value,
    };

    const firstGet = await storage.nep17Balances.tryGet(key);
    expect(firstGet).toBeUndefined();
    await storage.commit([{ type: 'add', change: addChange, subType: 'add' }]);
    const secondGet = await storage.nep17Balances.tryGet(key);
    expect(secondGet).toBeDefined();
    expect(secondGet?.balance.toString()).toEqual('10');
    expect(secondGet?.lastUpdatedBlock).toEqual(1);
  });
});
