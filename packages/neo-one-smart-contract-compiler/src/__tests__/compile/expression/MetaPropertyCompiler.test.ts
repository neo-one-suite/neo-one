import { helpers } from '../../../__data__';

describe('MetaPropertyCompiler', () => {
  test('import.meta', async () => {
    helpers.compileString(
      `
      import.meta;
    `,
      { type: 'error' },
    );
  });
});
