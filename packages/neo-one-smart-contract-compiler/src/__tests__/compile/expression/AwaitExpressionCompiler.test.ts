import { helpers } from '../../../__data__';

describe('AwaitFunctionCompiler', () => {
  test('await', async () => {
    await helpers.compileString(
      `
      await 2;
    `,
      { type: 'error' },
    );
  });
});
