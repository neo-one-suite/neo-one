import { helpers } from '../../../__data__';

describe('ForOfStatementCompiler', () => {
  test('for of array', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3, 4];
      let result = 0;
      for (const a of x) {
        if (a === 4) {
          break;
        }
        result += a;
      }

      assertEqual(result, 6);
    `);
  });

  test('for of Object.keys', async () => {
    await helpers.executeString(`
      const x: { [key: string]: number } = {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
      };
      let result = 0;
      for (const a of Object.keys(x)) {
        if (a === 'd') {
          continue;
        }
        result += x[a];
      }

      assertEqual(result, 6);
    `);
  });
});
