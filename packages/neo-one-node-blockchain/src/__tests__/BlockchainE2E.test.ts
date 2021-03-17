// this should be an e2e actually but zoom zoom
import { main } from '@neo-one/node-neo-settings';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { Dispatcher } from '@neo-one/node-vm';
import LevelDOWN from 'leveldown';
import LevelUp from 'levelup';
import { Blockchain } from '../Blockchain';

describe('blockchain persist genesis block test', () => {
  test('test', async () => {
    const blockchainSettings = main();
    const genesisHash = blockchainSettings.genesisBlock.hash;
    const levelDBPath = '/Users/danielbyrne/Desktop/test-location';
    const db = LevelUp(LevelDOWN(levelDBPath));
    const storage = levelupStorage({
      db,
      context: { messageMagic: blockchainSettings.messageMagic, validatorsCount: blockchainSettings.validatorsCount },
    });

    const dispatcher = new Dispatcher({ levelDBPath });

    const blockchain = await Blockchain.create({
      settings: blockchainSettings,
      storage,
      vm: dispatcher,
      native: new NativeContainer(blockchainSettings),
    });

    const genesis = await blockchain.getBlock(genesisHash);
    expect(genesis).toBeDefined();
  });
});
