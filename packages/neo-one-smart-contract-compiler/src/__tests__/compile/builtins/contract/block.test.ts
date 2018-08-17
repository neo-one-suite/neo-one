import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Block', () => {
  test('properties', async () => {
    const node = await helpers.startNode();
    const block = await node.readClient.getBlock(0);
    await node.executeString(`
      import { Block, Header, Hash256, Address } from '@neo-one/smart-contract';

      const genesisHash = Hash256.from('${block.hash}')
      Block.for(0);
      Block.for(genesisHash);
      let block = Block.for(0);
      block = Block.for(genesisHash);

      assertEqual(block.hash, genesisHash);
      assertEqual(block.version, ${block.version});
      assertEqual(block.previousHash, Hash256.from('${block.previousBlockHash}'));
      assertEqual(block.index, ${block.index});
      assertEqual(block.time, ${block.time});
      assertEqual(block.nextConsensus, Address.from('${block.nextConsensus}'));
      assertEqual(block.transactions.length, 5);
      assertEqual(block.transactions[0].hash, Hash256.from('${block.transactions[0].hash}'));
      assertEqual(block.transactions[1].hash, Hash256.from('${block.transactions[1].hash}'));
      assertEqual(block.transactions[2].hash, Hash256.from('${block.transactions[2].hash}'));
      assertEqual(block.transactions[3].hash, Hash256.from('${block.transactions[3].hash}'));
      assertEqual(block.transactions[4].hash, Hash256.from('${block.transactions[4].hash}'));
      assertEqual(block instanceof Header, false);
      assertEqual(block instanceof Block, true);
    `);
  });

  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      import { Block } from '@neo-one/smart-contract';

      class MyBlock implements Block {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      import { Block } from '@neo-one/smart-contract';

      const x = Block;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
