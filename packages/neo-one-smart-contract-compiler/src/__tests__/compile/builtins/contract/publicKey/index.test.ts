import { helpers } from '../../../../../__data__';
import { DiagnosticCode } from '../../../../../DiagnosticCode';

describe('PublicKey', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      import { PublicKey } from '@neo-one/smart-contract';
      class MyPublicKey implements PublicKey {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      import { PublicKey } from '@neo-one/smart-contract';
      const x = PublicKey;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
