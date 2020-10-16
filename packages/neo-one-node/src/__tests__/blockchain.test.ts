import { common, crypto, JSONHelper } from '@neo-one/client-common';
import { Blockchain } from '@neo-one/node-blockchain';
import { StorageKey, StreamOptions } from '@neo-one/node-core';
import { KeyBuilder, NativeContainer } from '@neo-one/node-native';
import { test as createTest } from '@neo-one/node-neo-settings';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { blockchainSettingsToProtocolSettings, Dispatcher } from '@neo-one/node-vm';
import { BN } from 'bn.js';
import LevelUp from 'levelup';
import RocksDB from 'rocksdb';
import { map, toArray } from 'rxjs/operators';
import { data } from '../__data__';

describe('Blockchain storage works', () => {
  test('Blockchain can persist and retrieve blocks', async () => {
    const blockchainSettings = createTest();
    const levelDBPath = '/Users/danielbyrne/Desktop/test-location';
    const db = LevelUp(RocksDB(levelDBPath));

    const storage = levelupStorage({
      db,
      context: { messageMagic: blockchainSettings.messageMagic },
    });

    const dispatcher = new Dispatcher({
      levelDBPath,
      protocolSettings: blockchainSettingsToProtocolSettings(blockchainSettings),
    });

    const balances = await storage.nep5Balances.all$.pipe(toArray()).toPromise();

    console.log(balances);

    // const native = new NativeContainer(blockchainSettings);
    // const blockchain = await Blockchain.create({
    //   settings: blockchainSettings,
    //   storage,
    //   vm: dispatcher,
    //   native,
    // });

    // console.log(blockchain.currentBlockIndex);

    // await blockchain.persistBlock({ block: data.debugBlock });
  });
});
