import { helpers } from '../../../__data__';

describe('FunctionExpressionCompiler', () => {
  test('basic function', async () => {
    await helpers.executeString(`
      const addOne = function(x: number): number {
        return x + 1;
      }

      if (addOne(1) !== 2) {
        throw 'Failure';
      }

      if (addOne(2) !== 3) {
        throw 'Failure';
      }
    `);
  });
});
