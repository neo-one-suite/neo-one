import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array.prototype.filter', () => {
  test('should filter an array with a function', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3, 4];
      const y = x.filter((value) => value % 2 === 0);

      assertEqual(y.length, 2);
      assertEqual(y[0], 2);
      assertEqual(y[1], 4);
    `);
  });

  test('should filter an array with a function with idx', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3, 4];
      const y = x['filter']((value, idx) => idx % 2 === 0);

      assertEqual(y.length, 2);
      assertEqual(y[0], 1);
      assertEqual(y[1], 3);
    `);
  });

  test('should apply a function over an array', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3, 4];
      let result = 0;
      x.filter((value) => {
        result += value;
      });

      assertEqual(x.length, 4);
      assertEqual(result, 10);
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = [0, 1, 2];
      const y = x.filter;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
