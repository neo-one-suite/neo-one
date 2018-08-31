import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Buffer.concat', () => {
  test('should concat zero buffers', async () => {
    await helpers.executeString(`
      Buffer.concat([]);
      const z = Buffer.concat([]);
      const expected = Buffer.from('', 'hex');

      assertEqual(z.equals(expected), true);
    `);
  });

  test('should concat one buffer', async () => {
    await helpers.executeString(`
      const x = Buffer.from('5946', 'hex');
      const z = Buffer.concat([x]);
      const expected = Buffer.from('5946', 'hex');

      assertEqual(z.equals(expected), true);
    `);
  });

  test('should concat two buffers', async () => {
    await helpers.executeString(`
      const b = Buffer;
      const x = b.from('5946', 'hex');
      const y = b.from('158a', 'hex');
      const z = b.concat([x, y]);
      const expected = b.from('5946158a', 'hex');

      assertEqual(z.equals(expected), true);
    `);
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      const keys = Buffer.concat;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be set', async () => {
    helpers.compileString(
      `
      Buffer.concat = (list: Buffer[]) => Buffer.from('', 'hex');
    `,
      { type: 'error' },
    );
  });

  test('cannot be "referenced"', async () => {
    helpers.compileString(
      `
      const keys = Buffer['concat'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
