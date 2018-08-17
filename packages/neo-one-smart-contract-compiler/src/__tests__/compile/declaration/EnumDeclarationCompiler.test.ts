import { helpers } from '../../../__data__';

describe('EnumDeclarationCompiler', () => {
  test('enum Foo', async () => {
    helpers.compileString(
      `
      enum Foo {
        x = 0,
      }
    `,
      { type: 'error' },
    );
  });
});
