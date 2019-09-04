import { helpers } from '../../../__data__';

describe('YieldExpressionCompiler', () => {
  test.skip('yield', async () => {
    helpers.compileString(
      `
      function* foo() {
        yield 'foo';
      }
    `,
      { type: 'error' },
    );
  });
});
