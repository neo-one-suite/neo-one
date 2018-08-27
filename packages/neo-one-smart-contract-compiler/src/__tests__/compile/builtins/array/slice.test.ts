import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array.prototype.slice', () => {
  test('should slice array to array', async () => {
    await helpers.executeString(`
      const x: ReadonlyArray<number> = [1, 2, 3, 4];
      const result = x.slice();

      assertEqual(result.length, 4);
      assertEqual(result[0], 1);
      assertEqual(result[1], 2);
      assertEqual(result[2], 3);
      assertEqual(result[3], 4);
    `);
  });

  test('should slice start', async () => {
    await helpers.executeString(`
    const x: ReadonlyArray<number> = [1, 2, 3, 4];
    x.slice(2);
    const result = x.slice(2);

    assertEqual(result.length, 2);
    assertEqual(result[0], 3);
    assertEqual(result[1], 4);
    `);
  });

  test('should slice start with end', async () => {
    await helpers.executeString(`
      const x: ReadonlyArray<number> = [1, 2, 3, 4];
      const result = x.slice(1, 3);

      assertEqual(result.length, 2);
      assertEqual(result[0], 2);
      assertEqual(result[1], 3);
    `);
  });

  test('should slice negative start', async () => {
    await helpers.executeString(`
    const x: ReadonlyArray<number> = [1, 2, 3, 4];
    const result = x.slice(-1);

    assertEqual(result.length, 1);
    assertEqual(result[0], 4);
    `);
  });

  test('should slice negative end', async () => {
    await helpers.executeString(`
    const x: ReadonlyArray<number> = [1, 2, 3, 4];
    const result = x.slice(-2, -1);

    assertEqual(result.length, 1);
    assertEqual(result[0], 3);
    `);
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      const x: ReadonlyArray<number> = [0, 1, 2];
      const y = x.slice;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
