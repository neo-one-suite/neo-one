import { common, ScriptBuilder } from '@neo-one/client-common';
import { Blockchain } from '@neo-one/node-blockchain';
import { ContractState } from '@neo-one/node-core';
import { NativeContainer } from '@neo-one/node-native';
import { test as createTest } from '@neo-one/node-neo-settings';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { blockchainSettingsToProtocolSettings, Dispatcher } from '@neo-one/node-vm';
import LevelUp from 'levelup';
import RocksDB from 'rocksdb';
import Memdown from 'memdown';
import { getData } from '../__data__';

const rawReadStreamPromise = async (db: any, options: { readonly gte: Buffer; readonly lte: Buffer }) =>
  new Promise((resolve, reject) => {
    db.createReadStream(options)
      .on('data', (data: any) => {
        console.log(common.uInt160ToString(data.key.slice(1)));
        console.log(
          JSON.stringify(
            ContractState.deserializeWire({
              context: { messageMagic: 1951352142, validatorsCount: 1 },
              buffer: data.value,
            }).serializeJSON(),
            undefined,
            2,
          ),
        );
      })
      .on('error', reject)
      .on('close', resolve)
      .on('end', resolve);
  });

describe.skip('Blockchain invocation / storage tests', () => {
  test('dispatcher can retrieve logs after invocation', async () => {
    const blockchainSettings = createTest();
    const levelDBPath = '/Users/danielbyrne/Desktop/node-data';
    const db = LevelUp(RocksDB(levelDBPath));

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

    const builder = new ScriptBuilder();
    builder.emitSysCall('System.Runtime.Log', 'Hello world!');
    const script = builder.build();

    const result = blockchain.invokeScript(script);

    expect(result.logs.length).toEqual(1);
    expect(result.logs[0].message).toEqual('Hello world!');
  });
});

describe('VM memory store for testing', () => {
  test('can persist 2 blocks in memory', async () => {
    const settings = createTest();
    const blockData = getData(settings.messageMagic);
    const db = LevelUp(Memdown());

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
    });

    const changes = await new Promise<Array<{ key: Buffer; value: Buffer }>>((resolve, reject) => {
      let changesInternal: Array<{ key: Buffer; value: Buffer }> = [];
      db.createReadStream()
        .on('data', (data) => {
          changesInternal = changesInternal.concat(data);
        })
        .on('close', () => resolve(changesInternal))
        .on('end', () => resolve(changesInternal))
        .on('error', (reason) => reject(reason));
    });

    dispatcher.updateStore(changes);

    await blockchain.persistBlock({ block: blockData.secondBlock });

    expect(blockchain.currentBlockIndex).toEqual(1);
  });
});
