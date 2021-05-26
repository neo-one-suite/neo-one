import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array.prototype[Symbol.iterator]', () => {
  test('should return an iterator over the array', async () => {
    await helpers.executeStringWithContract(`
      const x = [1, 2, 3];
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

  test('should return an iterator over an empty array', async () => {
    await helpers.executeStringWithContract(`
      const x: Array<number> = [];
      const y = x[Symbol.iterator]();

      let result = y.next();
      assertEqual(result.value as number | undefined, undefined);
      assertEqual(result.done, true);
    `);
  });

  test('should return an iterator over an array with one undefined element', async () => {
    await helpers.executeStringWithContract(`
      const x = [undefined];
      const y = x[Symbol.iterator]();

      let result = y.next();
      assertEqual(result.value, undefined);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value, undefined);
      assertEqual(result.done, true);
    `);
  });

  test('should return an iterator over the array as possible object', async () => {
    await helpers.executeStringWithContract(`
      interface Arr<T> {
        [Symbol.iterator](): IterableIterator<T>;
      }
      const x: Arr<number> | Array<number> = [1, 2, 3] as Arr<number> | Array<number>;
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
      const x = [0, 1, 2];
      const y = x[Symbol.iterator];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
