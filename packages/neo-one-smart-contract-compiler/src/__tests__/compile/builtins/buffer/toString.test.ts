import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Buffer.prototype.toString', () => {
  test('should equal equivalent string', async () => {
    await helpers.executeString(`
      const x = Buffer.from('hello', 'utf8');

      assertEqual(x.toString('utf8'), 'hello');
    `);
  });

  test('should equal equivalent string with "toString"', async () => {
    await helpers.executeString(`
      const x = Buffer.from('hello', 'utf8');

      assertEqual(x['toString']('utf8'), 'hello');
    `);
  });

  test('should equal equivalent string with "toString" as object or Buffer', async () => {
    await helpers.executeString(`
      interface Buf {
        toString(encoding: 'utf8'): string;
      }
      const x: Buffer | Buf = Buffer.from('hello', 'utf8') as Buffer | Buf;

      x['toString']('utf8');
      assertEqual(x['toString']('utf8'), 'hello');
    `);
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      const x = Buffer.from('5946158ab93f5f4fd6ba230f1c6c235117eec5f83e65275ac6f93ada9ca60477', 'hex');
      const y = x.toString;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot have argument other than utf8', async () => {
    helpers.compileString(
      `
      Buffer.from('5946158ab93f5f4fd6ba230f1c6c235117eec5f83e65275ac6f93ada9ca60477', 'hex').toString('hex');
    `,
      { type: 'error' },
    );
  });
});
