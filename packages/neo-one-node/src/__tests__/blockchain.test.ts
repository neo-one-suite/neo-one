import { common, crypto, JSONHelper } from '@neo-one/client-common';
import { Blockchain } from '@neo-one/node-blockchain';
import { Nep5BalanceKey, StorageKey, StreamOptions, utils } from '@neo-one/node-core';
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
        console.log(data.key.toString('hex'));
      })
      .on('error', reject)
      .on('close', resolve)
      .on('end', resolve);
  });

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

    const native = new NativeContainer(blockchainSettings);

    const blockchain = await Blockchain.create({
      settings: blockchainSettings,
      storage,
      vm: dispatcher,
      native,
    });

    const sc = '0xf813c2cc8e18bbe4b3b87f8ef9105b50bb93918e';
    const scriptHash = common.stringToUInt160(sc).reverse();

    const timeIn = Buffer.from('830ce2c273010000', 'hex');

    const gte = Buffer.concat([scriptHash, timeIn]);
    const lte = Buffer.concat([scriptHash, new BN(Date.now(), 'le').toBuffer()]);

    const transfers = await storage.nep5TransfersSent.find$(gte, lte).pipe(toArray()).toPromise();
    expect(transfers.length).toBeGreaterThan(0);
  });
});
