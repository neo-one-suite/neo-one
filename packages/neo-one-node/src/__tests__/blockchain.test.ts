import { common, crypto, JSONHelper, ScriptBuilder } from '@neo-one/client-common';
import { Blockchain } from '@neo-one/node-blockchain';
import {
  Nep5BalanceKey,
  StorageKey,
  StreamOptions,
  TrimmedBlock,
  utils,
  ContractState,
  VMLog,
} from '@neo-one/node-core';
import { KeyBuilder, NativeContainer, NEOAccountState } from '@neo-one/node-native';
import { test as createTest } from '@neo-one/node-neo-settings';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { blockchainSettingsToProtocolSettings, Dispatcher } from '@neo-one/node-vm';
import { utils as commonUtils } from '@neo-one/utils';
import { BN } from 'bn.js';
import LevelUp from 'levelup';
import RocksDB from 'rocksdb';
import { filter, map, toArray } from 'rxjs/operators';
import { data } from '../__data__';

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

describe('Blockchain invocation / storage tests', () => {
  test.only('dispatcher can retrieve logs after invocation', async () => {
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
