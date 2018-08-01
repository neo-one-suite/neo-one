import { helpers } from '../../../__data__';

describe('PostfixUnaryExpressionCompiler', () => {
  test('increment', async () => {
    await helpers.executeString(`
      let i = 1;

      if (i++ !== 1) {
        throw 'Failure';
      }

      if (i !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('decrement', async () => {
    await helpers.executeString(`
      let i = 3;

      i--;

      if (i-- !== 2) {
        throw 'Failure';
      }

      if (i !== 1) {
        throw 'Failure';
      }
    `);
  });
});
