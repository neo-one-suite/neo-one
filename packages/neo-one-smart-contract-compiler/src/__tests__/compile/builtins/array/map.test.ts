import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array.prototype.map', () => {
  test('should apply a function over an array', async () => {
    await helpers.executeString(`
      const x = [0, 1, 2];
      const y = x.map((value) => value + 1);

      assertEqual(y.length, 3);
      assertEqual(y[0], 1);
      assertEqual(y[1], 2);
      assertEqual(y[2], 3);
    `);
  });

  test('should apply a function over an array with index', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];
      const y = x.map((value, idx) => idx + 1);

      assertEqual(y.length, 3);
      assertEqual(y[0], 1);
      assertEqual(y[1], 2);
      assertEqual(y[2], 3);
    `);
  });

  test('should apply a function over an array (or object) with index', async () => {
    await helpers.executeString(`
      interface Arr<T> {
        map<U>(callbackfn: (value: T, index: number) => U): U[];
      }
      const x: Array<number> | Arr<number> = [1, 2, 3] as Array<number> | Arr<number>;
      const y = x['map']((value, idx) => idx + 1);

      assertEqual(y.length, 3);
      assertEqual(y[0], 1);
      assertEqual(y[1], 2);
      assertEqual(y[2], 3);
    `);
  });

  test('should apply a function over an array without returning the array', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3, 4];
      let result = 0;
      x.map((value) => {
        result += value;
      });

      assertEqual(x.length, 4);
      assertEqual(result, 10);
    `);
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      const x = [0, 1, 2];
      const y = x.map;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be "referenced"', async () => {
    helpers.compileString(
      `
      const x = [0, 1, 2];
      const y = x['map'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
