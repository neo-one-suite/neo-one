import { helpers } from '../../../__data__';

describe('ElementAccessExpressionCompiler', () => {
  test('[0, 1, 2][idx] and ["idx"] and properties', async () => {
    await helpers.executeString(`
      const x = [0];
      if (x.length !== 1) {
        throw 'Failure';
      }

      x[2] = 2;
      if (x.length !== 3) {
        throw 'Failure';
      }

      if (x[1] !== undefined) {
        throw 'Failure';
      }

      x[1] = 1;
      x['0x'] = 3;
      x['1x'] = 4;
      x['2x'] = 5;
      x.x = 6;

      if (x[0] !== 0) {
        throw 'Failure';
      }

      if (x['0x'] !== 3) {
        throw 'Failure';
      }

      if (x[1] !== 1) {
        throw 'Failure';
      }

      if (x['1x'] !== 4) {
        throw 'Failure';
      }

      if (x[2] !== 2) {
        throw 'Failure';
      }

      if (x['2x'] !== 5) {
        throw 'Failure';
      }

      if (x.x !== 6) {
        throw 'Failure';
      }
    `);
  });
});
