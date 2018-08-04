import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('TemplateStringsArray', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      class MyTemplateStringsArray implements TemplateStringsArray {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });
});
