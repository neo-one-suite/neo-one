import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Buffer.prototype.equals', () => {
  test('should equal self', async () => {
    await helpers.executeString(`
      const x = Buffer.from('5946158ab93f5f4fd6ba230f1c6c235117eec5f83e65275ac6f93ada9ca60477', 'hex');

      x.equals(x);
      assertEqual(x.equals(x), true);
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = Buffer.from('5946158ab93f5f4fd6ba230f1c6c235117eec5f83e65275ac6f93ada9ca60477', 'hex');
      const y = x.equals;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
