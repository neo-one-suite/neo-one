import { helpers } from '../../../../__data__';
import { ArrayEntries } from '../../../../compile/builtins/array/entries';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array.prototype.entries', () => {
  test('should return an iterator over the array', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];
      x.entries();
      let y = x.entries();
      y = y[Symbol.iterator]();

      let result = y.next();
      assertEqual(result.value[0], 0);
      assertEqual(result.value[1], 1);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value[0], 1);
      assertEqual(result.value[1], 2);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value[0], 2);
      assertEqual(result.value[1], 3);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value as [number, number] | undefined, undefined);
      assertEqual(result.done, true);
      result = y.next();
      assertEqual(result.value as [number, number] | undefined, undefined);
      assertEqual(result.done, true);
    `);
  });

  test('should return an iterator over an empty array', async () => {
    await helpers.executeString(`
      const x: Array<number> = [];
      const y = x.entries();

      let result = y.next();
      assertEqual(result.value as [number, number] | undefined, undefined);
      assertEqual(result.done, true);
    `);
  });

  test('should return an iterator over an array with one undefined element', async () => {
    await helpers.executeString(`
      const x = [undefined];
      const y = x.entries();

      let result = y.next();
      assertEqual(result.value[0], 0);
      assertEqual(result.value[1], undefined);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value as [number, undefined] | undefined, undefined);
      assertEqual(result.done, true);
    `);
  });

  test('should return an iterator over the array as possible object', async () => {
    await helpers.executeString(`
      interface Arr<T> {
        entries(): IterableIterator<[T, number]>;
      }
      const x: Arr<number> | Array<number> = [1, 2, 3] as Arr<number> | Array<number>;
      x.entries();
      const y = x.entries();

      let result = y.next();
      assertEqual(result.value[0], 0);
      assertEqual(result.value[1], 1);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value[0], 1);
      assertEqual(result.value[1], 2);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value[0], 2);
      assertEqual(result.value[1], 3);
      assertEqual(result.done, false);
      result = y.next();
      assertEqual(result.value as [number, number] | undefined, undefined);
      assertEqual(result.done, true);
      result = y.next();
      assertEqual(result.value as [number, number] | undefined, undefined);
      assertEqual(result.done, true);
    `);
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      const x: ReadonlyArray<number> = [0, 1, 2];
      const y = x.entries;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('canCall', () => {
    expect(new ArrayEntries().canCall()).toEqual(true);
  });
});
