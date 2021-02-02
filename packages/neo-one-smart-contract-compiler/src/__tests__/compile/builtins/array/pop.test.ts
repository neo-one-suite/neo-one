import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array.prototype.pop', () => {
  test('should return last element and decrement array', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];
      x.pop();
      const y = x.pop();

      assertEqual(x.length, 1);
      assertEqual(x[0], 1);
      assertEqual(y, 2);
    `);
  });

  test('should return undefined for empty array', async () => {
    await helpers.executeString(`
      const x: number[] = [];
      const y = x.pop();

      assertEqual(x.length, 0);
      assertEqual(y, undefined);
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = [0, 1, 2];
      const y = x.pop;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
