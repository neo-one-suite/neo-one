import { helpers } from '../../../__data__';

describe('DeleteExpressionCompiler', () => {
  test('unsupported', async () => {
    await helpers.compileString(
      `
      const x = { foo: string };
      delete x.foo;
    `,
      { type: 'error' },
    );
  });
});
