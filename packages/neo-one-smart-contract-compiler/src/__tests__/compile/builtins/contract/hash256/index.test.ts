import { helpers } from '../../../../../__data__';
import { DiagnosticCode } from '../../../../../DiagnosticCode';

describe('Hash256', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { Hash256 } from '@neo-one/smart-contract';
      class MyHash256 implements Hash256 {
      }
    `,
      { type: 'error' },
    );
  });

  test('cannot be called', async () => {
    await helpers.compileString(
      `
      import { Hash256 } from '@neo-one/smart-contract';

      Hash256();
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinCall },
    );
  });
});
