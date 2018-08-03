import { helpers } from '../../../__data__';

describe('ForInStatementCompiler', () => {
  test('for in array', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3, 4];
      let result = 0;
      for (const a in x) {
        if (a === '3') {
          break;
        }
        result += x[a];
      }

      assertEqual(result, 6);
    `);
  });

  test('for in object', async () => {
    await helpers.executeString(`
      const x: { [key: string]: number } = {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
      };
      let result = 0;
      for (const a in x) {
        if (a === 'd') {
          continue;
        }
        result += x[a];
      }

      assertEqual(result, 6);
    `);
  });
});
