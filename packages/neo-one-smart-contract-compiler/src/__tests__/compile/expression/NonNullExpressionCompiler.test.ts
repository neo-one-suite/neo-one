import { helpers } from '../../../__data__';

describe('NonNullExpressionCompiler', () => {
  test('x!', async () => {
    await helpers.executeString(`
      const x: number | undefined = 0 as number | undefined;

      if (x! !== 0) {
        throw 'Failure';
      }
    `);
  });
});
