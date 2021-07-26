import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

const properties = `
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: "*",
  };
`;

describe('Block', () => {
  test('properties', async () => {
    const node = await helpers.startNode();
    const block = await node.readClient.getBlock(0);
    const contract = await node.addContract(`
      import { Block, Hash256, Address, SmartContract } from '@neo-one/smart-contract';

      const test = () => {
        const genesisHash = Hash256.from('${block.header.hash}');
        Block.for(0);
        Block.for(genesisHash);
        let block = Block.for(0);
        block = Block.for(genesisHash);

        assertEqual(block.hash, genesisHash);
        assertEqual(block.version, ${block.header.version});
        assertEqual(block.previousHash, Hash256.from('${block.header.previousBlockHash}'));
        assertEqual(block.index, ${block.header.index});
        assertEqual(block.primaryIndex, ${block.header.primaryIndex});
        assertEqual(block.merkleRoot, Hash256.from('${block.header.merkleRoot}'));
        assertEqual(block.time, ${block.header.time.toString()});
        assertEqual(block.nextConsensus, Address.from('${block.header.nextConsensus}'));
        assertEqual(block.transactionsLength, 0);
        assertEqual(block instanceof Block, true);
        assertEqual(block.nonce, ${block.header.nonce.toString()});
      }

      export class BlockContract extends SmartContract {
        ${properties}

        public run(): void {
          test();
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        run(): void;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));
      contract.run();
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
