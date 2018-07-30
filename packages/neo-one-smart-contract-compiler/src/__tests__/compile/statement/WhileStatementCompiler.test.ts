import { helpers } from '../../../__data__';

describe('WhileStatementCompiler', () => {
  test('simple', async () => {
    await helpers.executeString(`
      let result = 0;
      let done = false;

      while (!done) {
        result += 1;
        if (result > 2) {
          done = true;
        }
      }

      if (result !== 3) {
        throw 'Failure';
      }
    `);
  });
});
