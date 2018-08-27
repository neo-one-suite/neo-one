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

  test('for of entries', async () => {
    await helpers.executeString(`
      const x: ReadonlyArray<number> = [1, 2, 3];
      for (const [idx, value] of x.entries()) {
        assertEqual(value, idx + 1);
      }
    `);
  });

  test('for of iterable', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3, 4];
      let result = 0;
      for (const a of x[Symbol.iterator]()) {
        if (a === 4) {
          break;
        }
        result += a;
      }

      assertEqual(result, 6);
    `);
  });

  test('for of iterable objects', async () => {
    await helpers.executeString(`
      const x = [{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }];
      let result = 0;
      for (const { a } of x[Symbol.iterator]()) {
        if (a === 4) {
          break;
        }
        result += a;
      }

      assertEqual(result, 6);
    `);
  });
});
