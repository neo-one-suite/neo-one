import { common } from '@neo-one/client-core';
import { helpers } from '../../../../../__data__';
import { DiagnosticCode } from '../../../../../DiagnosticCode';

describe('Hash256.from', () => {
  test('should return an address from literal hash', async () => {
    await helpers.executeString(`
      import { Hash256 } from '@neo-one/smart-contract';
      Hash256.from('${common.NEO_ASSET_HASH}');
      const x = Hash256.from('${common.NEO_ASSET_HASH}');

      assertEqual(x.equals(x), true);
    `);
  });

  test('Reports error on invalid hash256', async () => {
    helpers.compileString(
      `
      import { Hash256 } from '@neo-one/smart-contract';
      const keys = Hash256.from('abc');
    `,
      { type: 'error', code: DiagnosticCode.InvalidLiteral },
    );
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      import { Hash256 } from '@neo-one/smart-contract';
      const keys = Hash256.from;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be referenced - object literal', async () => {
    helpers.compileString(
      `
      import { Hash256 } from '@neo-one/smart-contract';
      const { from } = Hash256;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be element referenced', async () => {
    helpers.compileString(
      `
      import { Hash256 } from '@neo-one/smart-contract';
      const keys = Hash256['from'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
