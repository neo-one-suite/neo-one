import { helpers } from '../../../__data__';

describe('ElementAccessExpressionCompiler', () => {
  test('[0, 1, 2][idx]', async () => {
    await helpers.executeString(`
      const x: Array<number> = [0] as Array<number>;
      if (x.length !== 1) {
        throw 'Failure';
      }

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
    `);
  });
});
