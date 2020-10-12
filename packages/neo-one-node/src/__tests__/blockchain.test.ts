import { common } from '@neo-one/client-common';
import { Blockchain } from '@neo-one/node-blockchain';
import { NativeContainer } from '@neo-one/node-native';
import { test as createTest } from '@neo-one/node-neo-settings';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { blockchainSettingsToProtocolSettings, Dispatcher } from '@neo-one/node-vm';
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

    const genesisBlock = await blockchain.getBlock(0);
    expect(genesisBlock).toBeDefined();
    if (genesisBlock === undefined) {
      throw new Error('for ts');
    }

    expect(blockchainSettings.genesisBlock.equals(genesisBlock)).toEqual(true);
    const meta = await storage.blockHashIndex.tryGet();
    expect(meta?.hash).toEqual(blockchainSettings.genesisBlock.hash);

    // Persist index 1 block
    const prePersistSecondBlock = await blockchain.getBlock(1);
    expect(prePersistSecondBlock).not.toBeDefined();

    await blockchain.persistBlock({ block: data.secondBlock });

    const postPersistSecondBlock = await blockchain.getBlock(1);
    expect(postPersistSecondBlock).toBeDefined();

    // Persist index 2 block
    const prePersistThirdBlock = await blockchain.getBlock(2);
    expect(prePersistThirdBlock).not.toBeDefined();

    await blockchain.persistBlock({ block: data.thirdBlock });

    const postPersistThirdBlock = await blockchain.getBlock(2);
    expect(postPersistThirdBlock).toBeDefined();
  });
});
