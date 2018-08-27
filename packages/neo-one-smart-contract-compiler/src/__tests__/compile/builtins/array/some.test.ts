import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array.prototype.some', () => {
  test('should apply a function over an array', async () => {
    await helpers.executeString(`
      const x = [0, 1, 2];
      const y = x.some((value) => value === 1);

      assertEqual(y, true);
    `);
  });

  test('should apply a function over an array - false', async () => {
    await helpers.executeString(`
      const x = [0, 1, 2];
      const y = x.some((value) => value === 3);

      assertEqual(y, false);
    `);
  });

  test('should apply a function over an array with index', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];
      const y = x.some((value, idx) => value === idx + 1);

      assertEqual(y, true);
    `);
  });

  test('should apply a function over an array (or object) with index', async () => {
    await helpers.executeString(`
      interface Arr<T> {
        some(callbackfn: (value: T, index: number) => boolean): boolean;
      }
      const x: Array<number> | Arr<number> = [1, 2, 3] as Array<number> | Arr<number>;
      const y = x['some']((value, idx) => value - 1 === idx + 1);

      assertEqual(y, false);
    `);
  });

  test('should apply a function over an array without returning the array', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3, 4];
      let result = 0;
      x.some((value) => {
        result += value;

        return value === 3;
      });

      assertEqual(x.length, 4);
      assertEqual(result, 6);
    `);
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      const x = [0, 1, 2];
      const y = x.some;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be "referenced"', async () => {
    helpers.compileString(
      `
      const x = [0, 1, 2];
      const y = x['some'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
