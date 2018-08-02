import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Object', () => {
  test('cannot be extended', async () => {
    await helpers.compileString(
      `
      class MyObject extends Object {
      }
    `,
      { type: 'error', code: DiagnosticCode.CANNOT_EXTEND_BUILTIN },
    );
  });

  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      class MyObject implements Object {
      }
    `,
      { type: 'error', code: DiagnosticCode.CANNOT_IMPLEMENT_BUILTIN },
    );
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = Object;
    `,
      { type: 'error', code: DiagnosticCode.CANNOT_REFERENCE_BUILTIN },
    );
  });
});
