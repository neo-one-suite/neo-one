import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Set.prototype[Symbol.iterator]', () => {
  test('should return an iterator over the set', async () => {
    await helpers.executeStringWithContract(`
      const x = new Set<number>();
      x.add(1);
      x.add(2);
      x.add(3);
      x[Symbol.iterator]();
      let y = x[Symbol.iterator]();
      y = y[Symbol.iterator]();

      let result = y.next();
      assertEqual(result.value, 1);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value, 2);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value, 3);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value as number | undefined, undefined);
      assertEqual(result.done, true);
      result = y.next();
      assertEqual(result.value as number | undefined, undefined);
      assertEqual(result.done, true);
    `);
  });

  test('should return an iterator over an empty set', async () => {
    await helpers.executeStringWithContract(`
      const x: Set<number> = new Set();
      const y = x[Symbol.iterator]();

      let result = y.next();
      assertEqual(result.value as number | undefined, undefined);
      assertEqual(result.done, true);
    `);
  });

  test('should return an iterator over an set with one undefined element', async () => {
    await helpers.executeStringWithContract(`
      const x = new Set<number | undefined>();
      x.add(undefined);
      const y = x[Symbol.iterator]();

      let result = y.next();
      assertEqual(result.value, undefined);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value, undefined);
      assertEqual(result.done, true);
    `);
  });

  test('should return an iterator over the set as possible object', async () => {
    await helpers.executeStringWithContract(`
      interface St<T> {
        [Symbol.iterator](): IterableIterator<T>;
        readonly add: (value: T) => this;
      }
      const x: St<number> | Set<number> = new Set<number>() as St<number> | Set<number>;
      x.add(1);
      x.add(2);
      x.add(3);
      x[Symbol.iterator]();
      const y = x[Symbol.iterator]();

      let result = y.next();
      assertEqual(result.value, 1);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value, 2);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value, 3);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value as number | undefined, undefined);
      assertEqual(result.done, true);
      result = y.next();
      assertEqual(result.value as number | undefined, undefined);
      assertEqual(result.done, true);
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = new Set<number>();
      const y = x[Symbol.iterator];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
