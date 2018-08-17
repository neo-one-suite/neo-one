import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Input', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      import { Input } from '@neo-one/smart-contract';

      class MyInput implements Input {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      import { Input } from '@neo-one/smart-contract';

      const x = Input;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
