import { helpers } from '../../../../__data__';

describe('String', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      class MyString implements String {
      }
    `,
      { type: 'error' },
    );
  });

  test('cannot be extended', async () => {
    helpers.compileString(
      `
      class MyString extends String {
      }
    `,
      { type: 'error' },
    );
  });

  test('can be referenced and passed to functions', async () => {
    await helpers.executeString(`
      const x = [String];

      const foo = (value: ReadonlyArray<typeof String>) => {
        // do nothing
      };

      foo(x);
    `);
  });
});
