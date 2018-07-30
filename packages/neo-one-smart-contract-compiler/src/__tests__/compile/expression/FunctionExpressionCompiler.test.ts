import { helpers } from '../../../__data__';

describe('FunctionExpressionCompiler', () => {
  test('unsupported', async () => {
    await helpers.compileString(
      `
      const x = function() {
        return '';
      }
    `,
      { type: 'error' },
    );
  });
});
