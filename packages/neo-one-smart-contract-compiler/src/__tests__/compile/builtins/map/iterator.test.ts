import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Map.prototype[Symbol.iterator]', () => {
  test('should return an iterator over the map', async () => {
    await helpers.executeString(`
      const x = new Map<string, number>();
      x.set('a', 1);
      x.set('b', 2);
      x.set('c', 3);
      x[Symbol.iterator]();
      let y = x[Symbol.iterator]();
      y = y[Symbol.iterator]();

      let result = y.next();
      assertEqual(result.value[0], 'a');
      assertEqual(result.value[1], 1);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value[0], 'b');
      assertEqual(result.value[1], 2);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value[0], 'c');
      assertEqual(result.value[1], 3);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value as [string, number] | undefined, undefined);
      assertEqual(result.done, true);
      result = y.next();
      assertEqual(result.value as [string, number] | undefined, undefined);
      assertEqual(result.done, true);
    `);
  });

  test('should return an iterator over an empty map', async () => {
    await helpers.executeString(`
      const x = new Map<string, number>();
      const y = x[Symbol.iterator]();

      let result = y.next();
      assertEqual(result.value as [string, number] | undefined, undefined);
      assertEqual(result.done, true);
    `);
  });

  test('should return an iterator over the map as possible object', async () => {
    await helpers.executeString(`
      interface Mp<K, V> {
        readonly set: (key: K, value: V) => this;
        [Symbol.iterator](): IterableIterator<[K, V]>;
      }
      const x: Mp<string, number> | Map<string, number> = new Map() as Mp<string, number> | Map<string, number>;
      x.set('a', 1);
      x.set('b', 2);
      x.set('c', 3);
      x[Symbol.iterator]();
      let y = x[Symbol.iterator]();
      y = y[Symbol.iterator]();

      let result = y.next();
      assertEqual(result.value[0], 'a');
      assertEqual(result.value[1], 1);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value[0], 'b');
      assertEqual(result.value[1], 2);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value[0], 'c');
      assertEqual(result.value[1], 3);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value as [string, number] | undefined, undefined);
      assertEqual(result.done, true);
      result = y.next();
      assertEqual(result.value as [string, number] | undefined, undefined);
      assertEqual(result.done, true);
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = new Map<string, number>();
      const y = x[Symbol.iterator];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
