import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Blockchain', () => {
  test('currentHeight', async () => {
    const node = await helpers.startNode();

    await node.executeString(`
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentHeight;
      assertEqual(Blockchain.currentHeight === 0 || Blockchain.currentHeight === 1, true);
    `);
  });

  test('currentBlockTime', async () => {
    const node = await helpers.startNode();

    await node.executeString(`
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentBlockTime;
      assertEqual(Blockchain.currentBlockTime > 0, true);
    `);
  });

  test('set currentHeight', async () => {
    await helpers.compileString(
      `
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentHeight = 10;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinModify },
    );
  });

  test('set currentBlockTime', async () => {
    await helpers.compileString(
      `
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentBlockTime = 10;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinModify },
    );
  });
});
