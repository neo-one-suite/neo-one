import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array.prototype.map', () => {
  test('should apply a function over an array with an accumulator', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];
      const y = x.reduce((acc, value) => acc + value, 0);

      assertEqual(y, 6);
    `);
  });

  test('should apply a function over an array with index and an accumulator', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];
      const y = x.reduce((acc, value, idx) => acc + idx + 1, 0);

      assertEqual(y, 6);
    `);
  });

  test('should apply a function over an array without returning the accumulator', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3, 4];
      let result = 0;
      x.reduce((acc, value) => {
        result += value;

        return acc;
      }, 0);

      assertEqual(x.length, 4);
      assertEqual(result, 10);
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = [0, 1, 2];
      const y = x.map;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
