import { BN } from 'bn.js';
import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Buffer.prototype.toInteger', () => {
  test('should equal equivalent integer', async () => {
    const value = new BN(Buffer.from('hello', 'utf8'), 'le');
    await helpers.executeString(`
      const x = Buffer.from('hello', 'utf8');

      assertEqual(x.toInteger(), ${value.toString(10)});
    `);
  });

  test('should equal equivalent integer with "toInteger"', async () => {
    const value = new BN(Buffer.from('hello', 'utf8'), 'le');
    await helpers.executeString(`
      const x = Buffer.from('hello', 'utf8');

      assertEqual(x['toInteger'](), ${value.toString(10)});
    `);
  });

  test('should equal equivalent string with "toInteger" as object or Buffer', async () => {
    const value = new BN(Buffer.from('hello', 'utf8'), 'le');
    await helpers.executeString(`
      interface Buf {
        toInteger(): number;
      }
      const x: Buffer | Buf = Buffer.from('hello', 'utf8') as Buffer | Buf;

      x['toInteger']();
      assertEqual(x['toInteger'](), ${value.toString(10)});
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = Buffer.from('5946158ab93f5f4fd6ba230f1c6c235117eec5f83e65275ac6f93ada9ca60477', 'hex');
      const y = x.toInteger;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
