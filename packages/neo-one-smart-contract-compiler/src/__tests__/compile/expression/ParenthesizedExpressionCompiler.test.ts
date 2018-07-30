import { helpers } from '../../../__data__';

describe('ParenthesizedExpressionCompiler', () => {
  test('simple', async () => {
    await helpers.executeString(`
      const d = ((1 + 2) * (3 - 1)) / 2;

      if (d !== 3) {
        throw 'Failure';
      }
    `);
  });
});
