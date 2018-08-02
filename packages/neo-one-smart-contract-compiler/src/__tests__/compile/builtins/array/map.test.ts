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

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = [0, 1, 2];
      const y = x.map;
    `,
      { type: 'error', code: DiagnosticCode.CANNOT_REFERENCE_BUILTIN_PROPERTY },
    );
  });
});
