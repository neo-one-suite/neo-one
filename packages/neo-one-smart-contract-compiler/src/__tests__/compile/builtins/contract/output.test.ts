import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Output', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      import { Output } from '@neo-one/smart-contract';

      class MyOutput implements Output {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      import { Output } from '@neo-one/smart-contract';

      const x = Output;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
