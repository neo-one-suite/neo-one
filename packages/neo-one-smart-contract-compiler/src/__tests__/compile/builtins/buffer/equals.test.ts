import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Buffer.prototype.equals', () => {
  test('should equals self', async () => {
    await helpers.executeString(`
      const x = Buffer.from('5946158ab93f5f4fd6ba230f1c6c235117eec5f83e65275ac6f93ada9ca60477', 'hex');

      x.equals(x);
      assertEqual(x.equals(x), true);
    `);
  });

  test('should "equals" self', async () => {
    await helpers.executeString(`
      interface Buff { equals: (other: Buffer) => number }
      const x: Buff | Buffer = Buffer.from('3030', 'hex') as Buff | Buffer;
      const y = Buffer.from('3030', 'hex');

      x['equals'](y);
      assertEqual(x['equals'](y), true);
    `);
  });

  test('cannot be set', async () => {
    await helpers.compileString(
      `
      const x = Buffer.from('5946158ab93f5f4fd6ba230f1c6c235117eec5f83e65275ac6f93ada9ca60477', 'hex');
      x.equals = (otherBuffer: Buffer) => true;
    `,
      { type: 'error' },
    );
  });

  test('cannot be "set"', async () => {
    await helpers.compileString(
      `
      const x = Buffer.from('5946158ab93f5f4fd6ba230f1c6c235117eec5f83e65275ac6f93ada9ca60477', 'hex');
      x['equals'] = (otherBuffer: Buffer) => true;
    `,
      { type: 'error' },
    );
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
