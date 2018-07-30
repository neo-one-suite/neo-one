import { helpers } from '../../../__data__';

describe('VoidExpressionCompiler', () => {
  test('basic', async () => {
    await helpers.executeString(`
      if (undefined !== void 0) {
        throw 'Failure';
      }
    `);
  });
});
