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

      const contract = Contract.for(Address.from('${contract.address}'));

      if (contract === undefined) {
        assertEqual(contract !== undefined, true);
        throw new Error('For TS');
      }

      assertEqual(contract instanceof Contract, true);
      assertEqual(contract.script, ${helpers.getBufferHash(contract.script)});
      assertEqual(contract.payable, true);
    `);
  });

  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      import { Contract } from '@neo-one/smart-contract';

      class MyContract implements Contract {
      }
    `,
      { type: 'error' },
    );
  });

  test('invalid reference', () => {
    helpers.compileString(
      `
      import { Contract } from '@neo-one/smart-contract';

      const for = Contract.for;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('invalid "reference"', () => {
    helpers.compileString(
      `
      import { Contract } from '@neo-one/smart-contract';

      const for = Contract['for'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('invalid reference - object', () => {
    helpers.compileString(
      `
      import { Contract } from '@neo-one/smart-contract';

      const { for } = Contract;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
