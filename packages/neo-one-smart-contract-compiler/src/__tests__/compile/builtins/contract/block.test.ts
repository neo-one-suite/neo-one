import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Block', () => {
  test.only('properties', async () => {
    const node = await helpers.startNode();
    const block = await node.readClient.getBlock(0);
    await node.executeString(`
      import { Block, Hash256, Address } from '@neo-one/smart-contract';

      const genesisHash = Hash256.from('${block.hash}');
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
      assertEqual(block.transactionsLength, 5);
      assertEqual(block instanceof Block, true);
    `);
  });

  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { Block } from '@neo-one/smart-contract';

      class MyBlock implements Block {
      }
    `,
      { type: 'error' },
    );
  });

  test('invalid reference', async () => {
    await helpers.compileString(
      `
      import { Block } from '@neo-one/smart-contract';

      const for = Block.for;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('invalid "reference"', async () => {
    await helpers.compileString(
      `
      import { Block } from '@neo-one/smart-contract';

      const for = Block['for'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('invalid reference - object', async () => {
    await helpers.compileString(
      `
      import { Block } from '@neo-one/smart-contract';

      const { for } = Block;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
