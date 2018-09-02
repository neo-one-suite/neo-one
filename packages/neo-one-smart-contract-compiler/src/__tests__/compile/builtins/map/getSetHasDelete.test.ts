import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Map.prototype.get/set/has/delete', () => {
  test('should set a key/value pair on the map', async () => {
    await helpers.executeString(`
      const x = new Map<string, string>();
      x.set('foo', 'bar');
      const result = x.set('foo', 'baz');

      x.get('foo');
      x.has('foo');
      assertEqual(result, x);
      assertEqual(x.get('foo'), 'baz');
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
      const x = new Map<ReadonlyArray<number>, string>();
      const y = [0];
      const z = [0];
      x.set(y, 'bar').set(z, 'baz');

      assertEqual(x.get(y), 'bar');
      assertEqual(x.has(y), true);
      assertEqual(x.get(z), 'baz');
      assertEqual(x.has(z), true);
      assertEqual(x.get([0]), undefined);
      assertEqual(x.has([0]), false);
      assertEqual(x.size, 2);

      x.delete(y);
      assertEqual(x.delete(z), true);
      assertEqual(x.delete(z), false);
      assertEqual(x.size, 0);
      assertEqual(x.get(y), undefined);
      assertEqual(x.has(y), false);
      assertEqual(x.get(z), undefined);
      assertEqual(x.has(z), false);
    `);
  });

  test('should respect value semantics with buffers', async () => {
    await helpers.executeString(`
      interface Mp<K, V> {
        readonly get: (key: K) => V | undefined;
        readonly has: (key: K) => boolean;
        readonly size: number;
        readonly delete: (key: K) => boolean;
        readonly set: (key: K, value: V) => this;
      }
      const x: Mp<Buffer, string> | Map<Buffer, string> = new Map<Buffer, string>() as Mp<Buffer, string> | Map<Buffer, string>;
      const y = Buffer.from('ab', 'hex');
      const z = Buffer.from('ab', 'hex');
      x.set(y, 'bar');
      x['set'](z, 'baz');

      assertEqual(x.get(y), 'baz');
      assertEqual(x['get'](z), 'baz');
      assertEqual(x.get(Buffer.from('ab', 'hex')), 'baz');
      assertEqual(x['size'], 1);

      assertEqual(x.delete(Buffer.from('ab', 'hex')), true);
      assertEqual(x['delete'](Buffer.from('ab', 'hex')), false);
      assertEqual(x.size, 0);
      assertEqual(x.get(y), undefined);
      assertEqual(x.has(z), false);
    `);
  });

  test.skip('should respect value semantics with buffers', async () => {
    await helpers.executeString(`
      interface Mp<K, V> {
        readonly get: (key: K) => V | undefined;
        readonly has: (key: K) => boolean;
        readonly size: number;
        readonly delete: (key: K) => boolean;
        readonly set: (key: K, value: V) => this;
      }
      const x: Mp<Buffer, string> | Map<Buffer, string> = new Map<Buffer, string>() as Mp<Buffer, string> | Map<Buffer, string>;
      const y = Buffer.from('ab', 'hex');
      const z = Buffer.from('ab', 'hex');
      const result = x.set(y, 'bar')['set'](z, 'baz');

      assertEqual(result, x);
      assertEqual(x.get(y), 'baz');
      assertEqual(x['get'](z), 'baz');
      assertEqual(x.get(Buffer.from('ab', 'hex')), 'baz');
      assertEqual(x['size'], 1);

      assertEqual(x.delete(Buffer.from('ab', 'hex')), true);
      assertEqual(x['delete'](Buffer.from('ab', 'hex')), false);
      assertEqual(x.size, 0);
      assertEqual(x.get(y), undefined);
      assertEqual(x.has(z), false);
    `);
  });

  test('get cannot be referenced', async () => {
    helpers.compileString(
      `
      const x = new Map<string, number>();
      const y = x.get;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('set cannot be referenced', async () => {
    helpers.compileString(
      `
      const x = new Map<string, number>();
      const y = x.set;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('has cannot be referenced', async () => {
    helpers.compileString(
      `
      const x = new Map<string, number>();
      const y = x.has;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('delete cannot be referenced', async () => {
    helpers.compileString(
      `
      const x = new Map<string, number>();
      const y = x.delete;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
