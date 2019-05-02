import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Set.prototype.hasAddDelete', () => {
  test('should add a value to the set', async () => {
    await helpers.executeString(`
      const x = new Set<string>();
      x.add('foo');
      const result = x.add('foo');

      assertEqual(result, x);
      assertEqual(x.has('foo'), true);
      assertEqual(x.has('bar'), false);
      assertEqual(x.size, 1);

      assertEqual(x.delete('foo'), true);
      assertEqual(x.delete('foo'), false);
      assertEqual(x.delete('bar'), false);
      assertEqual(x.size, 0);
    `);
  });

  test('should respect reference semantics', async () => {
    await helpers.executeString(`
      const x = new Set<readonly number[]>();
      const y = [0];
      const z = [0];
      x.add(y).add(z);

      assertEqual(x.has(y), true);
      assertEqual(x.has(z), true);
      assertEqual(x.has([0]), false);
      assertEqual(x.size, 2);

      x.delete(y);
      assertEqual(x.delete(z), true);
      assertEqual(x.delete(z), false);
      assertEqual(x.size, 0);
      assertEqual(x.has(y), false);
      assertEqual(x.has(z), false);
    `);
  });

  test('should respect value semantics with buffers', async () => {
    await helpers.executeString(`
      interface St<T> {
        readonly has: (value: T) => boolean;
        readonly size: number;
        readonly delete: (value: T) => boolean;
        readonly add: (value: T) => this;
      }
      const x: St<Buffer> | Set<Buffer> = new Set<Buffer>() as St<Buffer> | Set<Buffer>;
      const y = Buffer.from('ab', 'hex');
      const z = Buffer.from('ab', 'hex');
      x.add(y);
      x['add'](z);

      assertEqual(x.has(y), true);
      assertEqual(x['has'](z), true);
      assertEqual(x.has(Buffer.from('ab', 'hex')), true);
      assertEqual(x['size'], 1);

      assertEqual(x.delete(Buffer.from('ab', 'hex')), true);
      assertEqual(x['delete'](Buffer.from('ab', 'hex')), false);
      assertEqual(x.size, 0);
      assertEqual(x.has(z), false);
    `);
  });

  test('add cannot be referenced', async () => {
    helpers.compileString(
      `
      const x = new Set<string>();
      const y = x.add;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('has cannot be referenced', async () => {
    helpers.compileString(
      `
      const x = new Set<string>();
      const y = x.has;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('delete cannot be referenced', async () => {
    helpers.compileString(
      `
      const x = new Set<string>();
      const y = x.delete;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
