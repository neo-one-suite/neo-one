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

  test('for of array - continue', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3, 4];
      let result = 0;
      for (const a of x) {
        if (a === 4) {
          continue;
        }
        result += a;
      }

      assertEqual(result, 6);
    `);
  });

  test('for of array - return', async () => {
    await helpers.executeString(`
      const func = () => {
        const x = [1, 2, 3, 4];
        let result = 0;
        for (const a of x) {
          if (a === 4) {
            return result;
          }
          result += a;
        }

        return result;
      }

      assertEqual(func(), 6);
    `);
  });

  test('for of array - throw', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3, 4];
      let result = 0;
      try {
        for (const a of x) {
          if (a === 4) {
            throw new Error('hello');
          }
          result += a;
        }
      } catch (error) {
        assertEqual((error as Error).message, 'hello');
        assertEqual(result, 6);
      }
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

  test('for of entries - return', async () => {
    await helpers.executeString(`
      const func = () => {
        const x: ReadonlyArray<number> = [1, 2, 3];
        for (const [idx, value] of x.entries()) {
          if (idx === 2) {
            return 0;
          }
          assertEqual(value, idx + 1);
        }

        return 0;
      }

      assertEqual(func(), 0);
    `);
  });

  test('for of entries - throw', async () => {
    await helpers.executeString(`
      try {
        const x: ReadonlyArray<number> = [1, 2, 3];
        for (const [idx, value] of x.entries()) {
          if (idx === 2) {
            throw new Error('hello');
          }
          assertEqual(value, idx + 1);
        }
      } catch (error) {
        assertEqual((error as Error).message, 'hello');
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

  test('for of iterable - return', async () => {
    await helpers.executeString(`
      const func = () => {
        const x: Iterable<number> = [1, 2, 3, 4] as Iterable<number>;
        let result = 0;
        for (const a of x) {
          if (a === 4) {
            return result;
          }
          result += a;
        }

        return result;
      }

      assertEqual(func(), 6);
    `);
  });

  test('for of iterable - throw', async () => {
    await helpers.executeString(`
      const x: Iterable<number> = [1, 2, 3, 4] as Iterable<number>;
      let result = 0;
      try {
        for (const a of x) {
          if (a === 4) {
            throw new Error('hello');
          }
          result += a;
        }
      } catch (error) {
        assertEqual((error as Error).message, 'hello');
        assertEqual(result, 6);
      }
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

  test('for of iterable iterator - return', async () => {
    await helpers.executeString(`
      const func = () => {
        const x = [1, 2, 3, 4];
        let result = 0;
        for (const a of x[Symbol.iterator]()) {
          if (a === 4) {
            return result;
          }
          result += a;
        }

        return result;
      }

      assertEqual(func(), 6);
    `);
  });

  test('for of iterable iterator - throw', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3, 4];
      let result = 0;
      try {
        for (const a of x[Symbol.iterator]()) {
          if (a === 4) {
            throw new Error('hello');
          }
          result += a;
        }
      } catch (error) {
        assertEqual((error as Error).message, 'hello');
        assertEqual(result, 6);
      }
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

  test('for of Map - return', async () => {
    await helpers.executeString(`
      const x = new Map<string, number>();
      x.set('a', 1);
      x.set('b', 2);
      x.set('c', 3);
      x.set('d', 4);
      let result = 0;
      let keys = '';

      const func = () => {
        for (const [key, value] of x) {
          if (value === 4) {
            return 10;
          }
          result += value;
          keys += key;
        }

        return 5;
      }

      assertEqual(func(), 10);
      assertEqual(result, 6);
      assertEqual(keys, 'abc');
    `);
  });

  test('for of Map - throw', async () => {
    await helpers.executeString(`
      const x = new Map<string, number>();
      x.set('a', 1);
      x.set('b', 2);
      x.set('c', 3);
      x.set('d', 4);
      let result = 0;
      let keys = '';

      try {
        for (const [key, value] of x) {
          if (value === 4) {
            throw new Error('hello');
          }
          result += value;
          keys += key;
        }
      } catch (error) {
        assertEqual((error as Error).message, 'hello');
        assertEqual(result, 6);
        assertEqual(keys, 'abc');
      }
    `);
  });

  test('for of set', async () => {
    await helpers.executeString(`
      const x = new Set([1, 1, 2, 3, 4]);
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

  test('for of set - return', async () => {
    await helpers.executeString(`
      const x = new Set([1, 1, 2, 3, 4]);
      let result = 0;
      const func = () => {
        for (const a of x) {
          if (a === 4) {
            return 10;
          }
          result += a;
        }

        return 5;
      }

      assertEqual(func(), 10);
      assertEqual(result, 6);
    `);
  });

  test('for of set - throw', async () => {
    await helpers.executeString(`
      const x = new Set([1, 1, 2, 3, 4]);
      let result = 0;
      try {
        for (const a of x) {
          if (a === 4) {
            throw new Error('foo');
          }
          result += a;
        }
      } catch (error) {
        assertEqual((error as Error).message, 'foo');
        assertEqual(result, 6);
      }
    `);
  });
});
