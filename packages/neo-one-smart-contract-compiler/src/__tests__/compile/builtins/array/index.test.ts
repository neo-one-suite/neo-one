import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array', () => {
  test('cannot be extended', async () => {
    await helpers.compileString(
      `
      class MyArray extends Array<number> {
      }
    `,
      { type: 'error', code: DiagnosticCode.CANNOT_EXTEND_BUILTIN },
    );
  });

  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      class MyArray implements Array<number> {
      }
    `,
      { type: 'error', code: DiagnosticCode.CANNOT_IMPLEMENT_BUILTIN },
    );
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = Array;
    `,
      { type: 'error', code: DiagnosticCode.CANNOT_REFERENCE_BUILTIN },
    );
  });
});
