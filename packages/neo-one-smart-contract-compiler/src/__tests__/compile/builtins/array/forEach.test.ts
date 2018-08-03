import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array.prototype.forEach', () => {
  test('should apply a function over an array', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];
      let result = 0;
      const y = x.forEach((value) => {
        result += value;
      });

      assertEqual(y, undefined);
      assertEqual(result, 6);
    `);
  });

  test('should apply a function over an array with index', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];
      let result = 0;
      x.forEach((value, idx) => {
        result += idx;
      });

      assertEqual(result, 3);
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = [0, 1, 2];
      const y = x.forEach;
    `,
      { type: 'error', code: DiagnosticCode.CANNOT_REFERENCE_BUILTIN_PROPERTY },
    );
  });
});
