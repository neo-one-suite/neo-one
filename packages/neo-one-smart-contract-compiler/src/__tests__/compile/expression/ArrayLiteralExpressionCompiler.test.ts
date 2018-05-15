import { helpers } from '../../../__data__';

describe('ArrayLiteralExpressionCompiler', () => {
  test('[1, foo(), y]', async () => {
    await helpers.executeString(`
      const foo = () => 2;
      const y = 3;
      const x = [1, foo(), 3];

      if (x[0] !== 1) {
        throw 'Failure';
      }

      if (x[1] !== 2) {
        throw 'Failure';
      }

      if (x[2] !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('[1, 2, 3].map((x) => x + 1)', async () => {
    await helpers.executeString(`
      const y = [1, 2, 3];
      const x = y.map((value) => value + 1);

      if (x[0] !== 2) {
        throw 'Failure';
      }

      if (x[1] !== 3) {
        throw 'Failure';
      }

      if (x[2] !== 4) {
        throw 'Failure';
      }
    `);
  });

  test('[1, 2, 3, 4].filter((x) => x % 2 === 0)', async () => {
    await helpers.executeString(`
      const y = [1, 2, 3, 4];
      const x = y.filter((value) => value % 2 === 0);

      if (x[0] !== 2) {
        throw 'Failure';
      }

      if (x[1] !== 4) {
        throw 'Failure';
      }
    `);
  });

  test('[1, 2, 3, 4].reduce((x, y) => x + y, 10)', async () => {
    await helpers.executeString(`
      const y = [1, 2, 3, 4];
      const x = y.reduce((a, b) => a + b, 10);

      if (x !== 20) {
        throw 'Failure';
      }
    `);
  });
});
