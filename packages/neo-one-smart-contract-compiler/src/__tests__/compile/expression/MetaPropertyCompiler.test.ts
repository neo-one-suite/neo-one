import { helpers } from '../../../__data__';

describe('MetaPropertyCompiler', () => {
  test('import.meta', async () => {
    await helpers.compileString(
      `
      import.meta;
    `,
      { type: 'error' },
    );
  });
});
