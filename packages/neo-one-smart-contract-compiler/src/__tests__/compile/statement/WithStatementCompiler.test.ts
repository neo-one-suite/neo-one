import { helpers } from '../../../__data__';

describe('WithStatementCompiler', () => {
  test('simple', async () => {
    await helpers.compileString(
      `
      let result = 0;
      const x = { y: 1 };
      with (x) {
        result = y;
      }

      if (result !== 1) {
        throw 'Failure';
      }
    `,
      {
        type: 'error',
      },
    );
  });
});
