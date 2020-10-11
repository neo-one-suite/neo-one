import { common } from '@neo-one/client-common';
import { Blockchain } from '@neo-one/node-blockchain';
import { NativeContainer } from '@neo-one/node-native';
import { test as createTest } from '@neo-one/node-neo-settings';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { blockchainSettingsToProtocolSettings, Dispatcher } from '@neo-one/node-vm';
import { BN } from 'bn.js';
import LevelUp from 'levelup';
import RocksDB from 'rocksdb';
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

    const native = new NativeContainer(blockchainSettings);
    const blockchain = await Blockchain.create({
      settings: blockchainSettings,
      storage,
      vm: dispatcher,
      native,
    });

    await blockchain.persistBlock({ block: data.debugBlock });
  });
});
