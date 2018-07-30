import { helpers } from '../../../__data__';

describe('ForOfStatementCompiler', () => {
  test.skip('for of array', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];
      let result = 0;
      for (const a of x) {
        result += a;
      }

      if (result !== 6) {
        throw 'Failure';
      }
    `);
  });
});
