import { helpers } from '../../../__data__';

describe('YieldExpressionCompiler', () => {
  test('yield', async () => {
    await helpers.compileString(
      `
      function* foo() {
        yield 'foo';
      }
    `,
      { type: 'error' },
    );
  });
});
