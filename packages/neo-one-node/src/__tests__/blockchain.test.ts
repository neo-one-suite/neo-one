import { common, crypto, JSONHelper } from '@neo-one/client-common';
import { Blockchain } from '@neo-one/node-blockchain';
import { Nep5BalanceKey, StorageKey, StreamOptions, TrimmedBlock, utils } from '@neo-one/node-core';
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
        console.log(data.key);
        console.log(
          TrimmedBlock.deserializeWire({
            context: { messageMagic: 7630401, validatorsCount: 1 },
            buffer: data.value,
          }).serializeJSON({ addressVersion: common.NEO_ADDRESS_VERSION }),
        );
      })
      .on('error', reject)
      .on('close', resolve)
      .on('end', resolve);
  });

describe('Blockchain storage works', () => {
  test.only('Blockchain can persist and retrieve blocks', async () => {
    // const blockchainSettings = createTest();
    const levelDBPath = '/Users/danielbyrne/Desktop/consensus-node-data';
    const db = LevelUp(RocksDB(levelDBPath));

    const storage = levelupStorage({
      db,
      context: { messageMagic: 7630401, validatorsCount: 1 },
    });

    await rawReadStreamPromise(db, { gte: Buffer.from([0x01]), lte: Buffer.from([0x02]) });

    // const blocks = await storage.blocks.all$.pipe(toArray()).toPromise();

    // blocks.forEach((block) => console.log(block.hashHex));
    // await rawReadStreamPromise(db, { gte: Buffer.from([0x00]), lte: Buffer.from([0xff]) });
    // const dispatcher = new Dispatcher({
    //   levelDBPath,
    //   protocolSettings: blockchainSettingsToProtocolSettings(blockchainSettings),
    // });

    // const native = new NativeContainer(blockchainSettings);

    // const blockchain = await Blockchain.create({
    //   settings: blockchainSettings,
    //   storage,
    //   vm: dispatcher,
    //   native,
    // });

    // const sc = '0xf813c2cc8e18bbe4b3b87f8ef9105b50bb93918e';
    // const scriptHash = common.stringToUInt160(sc).reverse();

    // const timeIn = Buffer.from('830ce2c273010000', 'hex');

    // const gte = Buffer.concat([scriptHash, timeIn]);
    // const lte = Buffer.concat([scriptHash, new BN(Date.now(), 'le').toBuffer()]);
  });

  test('', () => {
    const validators = [
      '023e9b32ea89b94d066e649b124fd50e396ee91369e8e2a6ae1b11c170d022256d',
      '03009b7540e10f2562e5fd8fac9eaec25166a58b26e412348ff5a86927bfac22a2',
      '02ba2c70f5996f357a43198705859fae2cfea13e1172962800772b3d588a9d4abd',
      '03408dcd416396f64783ac587ea1e1593c57d9fea880c8a6a1920e92a259477806',
      '02a7834be9b32e2981d157cb5bbd3acb42cfd11ea5c3b10224d7a44e98c5910f1b',
      '0214baf0ceea3a66f17e7e1e839ea25fd8bed6cd82e6bb6e68250189065f44ff01',
      '030205e9cefaea5a1dfc580af20c8d5aa2468bb0148f1a5e4605fc622c80e604ba',
    ].map(common.stringToECPoint);

    const testHash = crypto.toScriptHash(
      crypto.createMultiSignatureVerificationScript(validators.length - (validators.length - 1) / 3, validators),
    );
    const anotherHash = crypto.toScriptHash(
      crypto.createMultiSignatureVerificationScript(validators.length / 2 + 1, validators),
    );
    console.log(common.uInt160ToHex(testHash));
    console.log(common.uInt160ToHex(anotherHash));
    console.log(crypto.scriptHashToAddress({ addressVersion: common.NEO_ADDRESS_VERSION, scriptHash: testHash }));
    console.log(crypto.scriptHashToAddress({ addressVersion: common.NEO_ADDRESS_VERSION, scriptHash: anotherHash }));
  });
});
