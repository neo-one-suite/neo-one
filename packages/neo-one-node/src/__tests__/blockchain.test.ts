import { Blockchain } from '@neo-one/node-blockchain';
import { NativeContainer } from '@neo-one/node-native';
import { test as createTest } from '@neo-one/node-neo-settings';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { blockchainSettingsToProtocolSettings, Dispatcher } from '@neo-one/node-vm';
import LevelUp from 'levelup';
// tslint:disable-next-line: match-default-export-name
import Memdown from 'memdown';
import RocksDB from 'rocksdb';
import { getData } from '../__data__';

describe('Blockchain invocation / storage tests', () => {
  test('Can persist the first 3 blocks with disk storage', async () => {
    const blockchainSettings = createTest();
    const levelDBPath = '/Users/spencercorwin/Desktop/node-data';
    const db = LevelUp(RocksDB(levelDBPath));
    const blockData = getData(blockchainSettings.messageMagic);

    const storage = levelupStorage({
      db,
      context: {
        messageMagic: blockchainSettings.messageMagic,
        validatorsCount: blockchainSettings.validatorsCount,
      },
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

    await blockchain.persistBlock({ block: blockData.secondBlock });

    expect(blockchain.currentBlockIndex).toEqual(1);

    await blockchain.persistBlock({ block: blockData.thirdBlock });

    expect(blockchain.currentBlockIndex).toEqual(2);
  });
});

describe('Update and read dispatcher store and snapshot', () => {
  test('Can update store then read same key', async () => {
    const dispatcher = new Dispatcher();
    const key = Buffer.from([0x09]);
    const value = Buffer.from([0xfa]);
    dispatcher.updateStore([{ key, value }]);

    expect(dispatcher.readStore(key)).toEqual(value);
  });

  test('Can update snapshot and then read same key', async () => {
    const dispatcher = new Dispatcher();
    const id = 11;
    const key = Buffer.from([0x09]);
    const value = Buffer.from([0xfa]);

    dispatcher.updateSnapshot(key, id, value);

    expect(dispatcher.readSnapshot(key, id)).toEqual(value);
  });
});

describe('VM memory store for testing', () => {
  test('can persist 2 blocks in memory', async () => {
    const settings = createTest();
    const blockData = getData(settings.messageMagic);
    const db = LevelUp(Memdown());

    const getChanges = async () =>
      new Promise<Array<{ key: Buffer; value: Buffer }>>((resolve, reject) => {
        let changesInternal: Array<{ key: Buffer; value: Buffer }> = [];
        db.createReadStream()
          .on('data', (data) => {
            changesInternal = changesInternal.concat(data);
          })
          .on('close', () => resolve(changesInternal))
          .on('end', () => resolve(changesInternal))
          .on('error', reject);
      });

    const onPersist = async () => {
      const changes = await getChanges();
      dispatcher.updateStore(changes);
    };

    const storage = levelupStorage({
      db,
      context: {
        messageMagic: settings.messageMagic,
        validatorsCount: settings.validatorsCount,
      },
    });

    const dispatcher = new Dispatcher({
      protocolSettings: blockchainSettingsToProtocolSettings(settings),
    });

    const native = new NativeContainer(settings);

    const blockchain = await Blockchain.create({
      settings,
      storage,
      vm: dispatcher,
      native,
      onPersist,
    });

    await blockchain.persistBlock({ block: blockData.secondBlock });

    expect(blockchain.currentBlockIndex).toEqual(1);

    await blockchain.persistBlock({ block: blockData.thirdBlock });

    expect(blockchain.currentBlockIndex).toEqual(2);
  });
});
