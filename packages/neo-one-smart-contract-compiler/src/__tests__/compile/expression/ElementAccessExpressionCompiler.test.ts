import { helpers } from '../../../__data__';

describe('ElementAccessExpressionCompiler', () => {
  test('[0, 1, 2][idx]', async () => {
    await helpers.executeString(`
      const x: Array<number> = [0] as Array<number>;

      assertEqual(x.length, 1);

      const y: Array<number> = x;

      y[2] = 2;
      if (y.length !== 3) {
        throw 'Failure';
      }

      if (y[0] !== 0) {
        throw 'Failure';
      }

      if (y[1] !== undefined) {
        throw 'Failure';
      }

      if (y[2] !== 2) {
        throw 'Failure';
      }

      if ((y[2] += 1) !== 3) {
        throw 'Failure';
      }

      if (y[2] !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('{ a: 0, b: 1 }[element]', async () => {
    await helpers.executeString(`
      const x = { a: 0, b: 1 };
      if (x['a'] !== 0) {
        throw 'Failure';
      }

      if (x['b'] !== 1) {
        throw 'Failure';
      }

      if ((x['a'] += 1) !== 1) {
        throw 'Failure';
      }

      if (x['a'] !== 1) {
        throw 'Failure';
      }
    `);
  });

  test('{ [Symbol.for("a")]: 0 }[element]', async () => {
    await helpers.executeString(`
      const a = Symbol.for('a');
      const x = { [a]: 0 };
      if (x[a] !== 0) {
        throw 'Failure';
      }

      if ((x[a] += 1) !== 1) {
        throw 'Failure';
      }

      if (x[a] !== 1) {
        throw 'Failure';
      }
    `);
  });

  test('mixed index types', async () => {
    await helpers.executeString(`
      const a: string | number = 0 as string | number;
      const x = { [a]: 0 };
      if (x[a] !== 0) {
        throw 'Failure';
      }

      if ((x[a] += 1) !== 1) {
        throw 'Failure';
      }

      if (x[a] !== 1) {
        throw 'Failure';
      }

      x[a];
    `);
  });
});
