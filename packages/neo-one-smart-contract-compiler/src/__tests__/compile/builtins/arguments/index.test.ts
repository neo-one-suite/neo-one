import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('IArguments', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      class MyArray implements IArguments {
      }
    `,
      { type: 'error' },
    );
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      const y = () => {
        const x = arguments;
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
