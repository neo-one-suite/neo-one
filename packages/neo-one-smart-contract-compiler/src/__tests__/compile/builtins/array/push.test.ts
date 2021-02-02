import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array.prototype.push', () => {
  test('should push no value to array', async () => {
    await helpers.executeString(`
      const x = [1, 2];
      const result = x.push();

      assertEqual(result, 2);
      assertEqual(x.length, 2);
      assertEqual(x[0], 1);
      assertEqual(x[1], 2);
    `);
  });

  test('should push value to array', async () => {
    await helpers.executeString(`
      const x = [1, 2];
      const y = 3;
      x.push(y);

      assertEqual(x.length, 3);
      assertEqual(x[0], 1);
      assertEqual(x[1], 2);
      assertEqual(x[2], 3);
    `);
  });

  test('should push many values to array', async () => {
    await helpers.executeString(`
      const x = [1, 2];
      const y = 3;
      const z = 4;
      const result = x.push(y, z);

      assertEqual(result, 4);
      assertEqual(x.length, 4);
      assertEqual(x[0], 1);
      assertEqual(x[1], 2);
      assertEqual(x[2], 3);
      assertEqual(x[3], 4);
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = [0, 1, 2];
      const y = x.push;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
