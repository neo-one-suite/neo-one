import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Buffer', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      class MyBuffer implements Buffer {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      const x = Buffer;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('can be instanceof', async () => {
    await helpers.executeString(`
      const x = Buffer.from('5946158ab93f5f4fd6ba230f1c6c235117eec5f83e65275ac6f93ada9ca60477', 'hex');

      assertEqual(x instanceof Buffer, true);
    `);
  });
});
