import { helpers } from '../../../__data__';

describe('ConditionalExpressionCompiler', () => {
  test('true conditional', async () => {
    await helpers.executeString(`
      if (true ? false : true) {
        throw 'Failure';
      }
    `);
  });

  test('false conditional', async () => {
    await helpers.executeString(`
      if (false ? true : false) {
        throw 'Failure';
      }
    `);
  });
});
