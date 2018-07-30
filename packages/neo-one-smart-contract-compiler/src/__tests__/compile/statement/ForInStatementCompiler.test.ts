import { helpers } from '../../../__data__';

describe('ForInStatementCompiler', () => {
  test.skip('for in array', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];
      let result = 0;
      for (const a in x) {
        result += a;
      }

      if (result !== 6) {
        throw 'Failure';
      }
    `);
  });
});
