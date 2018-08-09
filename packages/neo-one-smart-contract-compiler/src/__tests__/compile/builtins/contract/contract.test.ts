import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Contract', () => {
  test('properties', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      assertEqual(1, 1);
    `);
    await node.executeString(`
      import { Contract, Address } from '@neo-one/smart-contract';

      const contract = Contract.for(Address.from('${contract.hash}'));

      assertEqual(contract.script, ${helpers.getBufferHash(contract.script)});
    `);
  });

  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { Contract } from '@neo-one/smart-contract';

      class MyContract implements Contract {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      import { Contract } from '@neo-one/smart-contract';

      const x = Contract;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
