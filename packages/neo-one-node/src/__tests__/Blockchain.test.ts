import { Blockchain } from '@neo-one/node-blockchain';
import { NativeContainer } from '@neo-one/node-native';
import { test as createTest } from '@neo-one/node-neo-settings';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { blockchainSettingsToProtocolSettings, Dispatcher } from '@neo-one/node-vm';
import LevelDOWN from 'leveldown';
import LevelUp from 'levelup';
import { data } from '../__data__';

describe('blockchain persists second block', () => {
  test('test', async () => {
    const blockchainSettings = createTest();
    const levelDBPath = '/Users/spencercorwin/Desktop/test-location';
    const db = LevelUp(LevelDOWN(levelDBPath));
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

    // const genesisHash = blockchainSettings.genesisBlock.hash;
    // console.log(blockchainSettings.genesisBlock.hashHex);
    // console.log('genesisHash from settings:');
    // console.log(genesisHash.toString('hex'));
    // console.log('genesisHash derived from RPC data');
    // console.log(data.firstBlock.hash.toString('hex'));
    // console.log('secondBlock.prevHash:');
    // console.log(data.secondBlock.previousHash.toString('hex'));
    // console.log(data.secondBlock.hashHex);
    // console.log(data.secondBlock.hash.toString('hex'));
    // console.log('Witness scripts in JS:');
    // console.log(data.secondBlock.serializeJSON({ addressVersion: 0x35 }));
    // console.log(data.secondBlock.witness.verification.toString('hex'));
    // console.log(data.secondBlock.witness.invocation.toString('hex'));
    await blockchain.persistBlock({ block: data.secondBlock, verify: true });

    // change to .getBlock()
    // const block = await blockchain.blocks.tryGet({ hashOrIndex: data.secondBlock.hash });

    // console.log(block);
    // expect(block).toBeDefined();
  });
});
