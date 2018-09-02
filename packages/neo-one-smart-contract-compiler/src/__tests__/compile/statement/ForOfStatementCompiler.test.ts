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
      const x: Iterable<number> = [1, 2, 3, 4] as Iterable<number>;
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

  test('for of iterable iterator', async () => {
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

  test('for of Map', async () => {
    await helpers.executeString(`
      const x = new Map<string, number>();
      x.set('a', 1);
      x.set('b', 2);
      x.set('c', 3);
      x.set('d', 4);
      let result = 0;
      let keys = '';
      for (const [key, value] of x) {
        if (value === 4) {
          break;
        }
        result += value;
        keys += key;
      }

      assertEqual(result, 6);
      assertEqual(keys, 'abc');
    `);
  });

  test('for of set', async () => {
    await helpers.executeString(`
      const x = new Set<number>();
      x.add(1);
      x.add(1);
      x.add(2);
      x.add(3);
      x.add(4);
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
});
