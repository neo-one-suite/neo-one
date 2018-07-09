import { helpers } from '../../../__data__';

describe('NewExpressionCompiler', () => {
  test('use New make an object', async () => {
    await helpers.executeString(`
      const d = new Array('one', 'two', 'three');
      if(! (d instanceof Array)) {
        throw 'Failure';
      }
    `);
  });
});
