import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Header', () => {
  test('properties', async () => {
    const node = await helpers.startNode();
    const header = await node.readClient.getBlock(0);
    await node.executeString(`
      import { Header, Block, Hash256, Address } from '@neo-one/smart-contract';

      const genesisHash = Hash256.from('${header.hash}')
      Header.for(0);
      Header.for(genesisHash);
      let header = Header.for(0);
      header = Header.for(genesisHash);

      assertEqual(header.hash, genesisHash);
      assertEqual(header.version, ${header.version});
      assertEqual(header.previousHash, Hash256.from('${header.previousBlockHash}'));
      assertEqual(header.index, ${header.index});
      assertEqual(header.time, ${header.time});
      assertEqual(header.nextConsensus, Address.from('${header.nextConsensus}'));
      assertEqual(header instanceof Header, true);
      assertEqual(header instanceof Block, false);
    `);
  });

  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { Header } from '@neo-one/smart-contract';

      class MyHeader implements Header {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      import { Header } from '@neo-one/smart-contract';

      const x = Header;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
