import { helpers } from '../../../__data__';

describe('DeleteExpressionCompiler', () => {
  test('unsupported', async () => {
    helpers.compileString(
      `
      const x = { foo: string };
      delete x.foo;
    `,
      { type: 'error' },
    );
  });
});
