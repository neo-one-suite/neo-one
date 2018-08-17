import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Boolean', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      class MyBoolean implements Boolean {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      const x = Boolean;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
