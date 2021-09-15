import { NativeContainer } from '@neo-one/node-native';
import { main } from '@neo-one/node-neo-settings';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { Dispatcher } from '@neo-one/node-vm';
import LevelDOWN from 'leveldown';
import LevelUp from 'levelup';
import { Blockchain } from '../Blockchain';

// TODO: this should be e2e test
describe('blockchain persist genesis block test', () => {
  test('test', async () => {
    const blockchainSettings = main();
    const genesisHash = blockchainSettings.genesisBlock.hash;
    const levelDBPath = '/Users/spencercorwin/Desktop/test-location';
    const db = LevelUp(LevelDOWN(levelDBPath));
    const storage = levelupStorage({
      db,
      context: {
        network: blockchainSettings.network,
        validatorsCount: blockchainSettings.validatorsCount,
        maxValidUntilBlockIncrement: 86400000 / 1500,
      },
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
