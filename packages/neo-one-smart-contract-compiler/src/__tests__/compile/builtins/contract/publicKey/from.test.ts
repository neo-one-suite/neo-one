import { common } from '@neo-one/client-common';
import { helpers, keys } from '../../../../../__data__';
import { DiagnosticCode } from '../../../../../DiagnosticCode';

describe('PublicKey.from', () => {
  test('should return an address from literal public key', async () => {
    await helpers.executeString(`
      import { PublicKey } from '@neo-one/smart-contract';
      PublicKey.from('${common.ecPointToString(keys[0].publicKey)}');
      const x = PublicKey.from('${common.ecPointToString(keys[0].publicKey)}');

      assertEqual(x.equals(x), true);
    `);
  });

  test('Reports error on invalid public key', async () => {
    await helpers.compileString(
      `
      import { PublicKey } from '@neo-one/smart-contract';
      const keys = PublicKey.from('abc');
    `,
      { type: 'error', code: DiagnosticCode.InvalidLiteral },
    );
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      import { PublicKey } from '@neo-one/smart-contract';
      const keys = PublicKey.from;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be referenced - object', async () => {
    await helpers.compileString(
      `
      import { PublicKey } from '@neo-one/smart-contract';
      const { from } = PublicKey;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be element referenced', async () => {
    await helpers.compileString(
      `
      import { PublicKey } from '@neo-one/smart-contract';
      const keys = PublicKey['from'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
