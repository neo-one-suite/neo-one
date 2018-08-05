import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';
import { BufferConcat } from '../../../../compile/builtins/buffer/concat';

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
      const x = Buffer.from('5946', 'hex');
      const y = Buffer.from('158a', 'hex');
      const z = Buffer.concat([x, y]);
      const expected = Buffer.from('5946158a', 'hex');

      assertEqual(z.equals(expected), true);
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const keys = Buffer.concat;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('canCall should throw an error', () => {
    expect(() => new BufferConcat().canCall()).toThrow();
  });
});
