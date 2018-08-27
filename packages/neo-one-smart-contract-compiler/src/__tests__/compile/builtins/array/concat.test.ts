import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array.prototype.concat', () => {
  test('should concat array to array', async () => {
    await helpers.executeString(`
      const x: ReadonlyArray<number> = [1, 2];
      const y = [3];
      x.concat(y);
      const result = x.concat(y);

      assertEqual(result.length, 3);
      assertEqual(result[0], 1);
      assertEqual(result[1], 2);
      assertEqual(result[2], 3);
    `);
  });

  test('should "concat" many arrays to array', async () => {
    await helpers.executeString(`
      const x: ReadonlyArray<number> = [1, 2];
      const y = [3];
      const z = [4];
      const result = x['concat'](y, z);

      assertEqual(result.length, 4);
      assertEqual(result[0], 1);
      assertEqual(result[1], 2);
      assertEqual(result[2], 3);
      assertEqual(result[3], 4);
    `);
  });

  test('should concat values to array', async () => {
    await helpers.executeString(`
      const x: ReadonlyArray<number> = [1, 2];
      const y = 3;
      const z = 4;
      const result = x.concat(y, z);

      assertEqual(result.length, 4);
      assertEqual(result[0], 1);
      assertEqual(result[1], 2);
      assertEqual(result[2], 3);
      assertEqual(result[3], 4);
    `);
  });

  test('should concat values to array as possible object', async () => {
    await helpers.executeString(`
      interface Arr<T> {
        concat(...items: (T | ConcatArray<T>)[]): T[];
      }
      const x: ReadonlyArray<number> | Arr<number> = [1, 2] as ReadonlyArray<number> | Arr<number>;
      const y = 3;
      const z = 4;
      const result = x.concat(y, z);

      assertEqual(result.length, 4);
      assertEqual(result[0], 1);
      assertEqual(result[1], 2);
      assertEqual(result[2], 3);
      assertEqual(result[3], 4);
    `);
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      const x: ReadonlyArray<number> = [0, 1, 2];
      const y = x.concat;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
