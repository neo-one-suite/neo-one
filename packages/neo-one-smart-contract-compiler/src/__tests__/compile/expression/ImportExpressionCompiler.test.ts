import { helpers } from '../../../__data__';

describe('ImportExpressionCompiler', () => {
  test('import("foo")', async () => {
    await helpers.compileString(
      `
      import('foo');
    `,
      { type: 'error' },
    );
  });
});
