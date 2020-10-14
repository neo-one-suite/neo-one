import { common } from '@neo-one/client-common';
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

describe('blockchain persists second block', () => {
  test('test', async () => {
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

    // console.log(dispatcher.test());

    const native = new NativeContainer(blockchainSettings);
    const blockchain = await Blockchain.create({
      settings: blockchainSettings,
      storage,
      vm: dispatcher,
      native,
    });

    await new Promise((resolve, reject) =>
      db
        .createReadStream()
        .on('data', (data: any) => {
          console.log(`key: ${data.key.toString('hex')}`);
          console.log(`value: ${data.key.toString('hex')}`);
        })
        .on('error', (error) => {
          reject(error);
        })
        .on('close', resolve)
        .on('end', resolve),
    );

    // console.log(blockchain.currentBlockIndex);

    // await blockchain.persistBlock({ block: data.debugBlock });
  });
});
