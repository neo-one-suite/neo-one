import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array', () => {
  test('can check instanceof', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3]

      x instanceof Array;
      assertEqual(x instanceof Array, true);
    `);
  });

  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      class MyArray implements Array<number> {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = Array;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
