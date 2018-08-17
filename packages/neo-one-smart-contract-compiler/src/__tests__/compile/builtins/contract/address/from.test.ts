import { common } from '@neo-one/client-core';
import { helpers, keys } from '../../../../../__data__';
import { DiagnosticCode } from '../../../../../DiagnosticCode';

describe('Address.from', () => {
  test('should return an address from literal NEO addresses and script hashes', async () => {
    await helpers.executeString(`
      import { Address } from '@neo-one/smart-contract';
      Address.from('${keys[0].address}');
      const x = Address.from('${keys[0].address}');
      const y = Address.from('${common.uInt160ToString(keys[0].scriptHash)}');

      assertEqual(x.equals(y), true);
    `);
  });

  test('Reports error on invalid address', async () => {
    helpers.compileString(
      `
      import { Address } from '@neo-one/smart-contract';
      const keys = Address.from('abc');
    `,
      { type: 'error', code: DiagnosticCode.InvalidLiteral },
    );
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      import { Address } from '@neo-one/smart-contract';
      const keys = Address.from;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be element referenced', async () => {
    helpers.compileString(
      `
      import { Address } from '@neo-one/smart-contract';
      const keys = Address['from'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
