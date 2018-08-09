import { helpers } from '../../../../../__data__';
import { DiagnosticCode } from '../../../../../DiagnosticCode';

describe('Address', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { Address } from '@neo-one/smart-contract';
      class MyAddress implements Address {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      import { Address } from '@neo-one/smart-contract';
      const x = Address;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
