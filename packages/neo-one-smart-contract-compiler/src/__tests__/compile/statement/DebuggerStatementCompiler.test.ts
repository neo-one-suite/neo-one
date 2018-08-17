import { helpers } from '../../../__data__';

describe('DebuggerStatementCompiler', () => {
  test('simple', async () => {
    helpers.compileString(
      `
      let result = 0;

      debugger;

      if (result !== 0) {
        throw 'Failure';
      }
    `,
      {
        type: 'error',
      },
    );
  });
});
