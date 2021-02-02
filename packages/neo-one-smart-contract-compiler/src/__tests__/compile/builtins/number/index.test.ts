import { helpers } from '../../../../__data__';

describe('Number', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      class MyNumber implements Number {
      }
    `,
      { type: 'error' },
    );
  });

  test('cannot be extended', async () => {
    await helpers.compileString(
      `
      class MyNumber extends Number {
      }
    `,
      { type: 'error' },
    );
  });

  test('can be referenced and passed to functions', async () => {
    await helpers.executeString(`
      const x = Number;

      const foo = (value: typeof Number) => {
        // do nothing
      };

      foo(x);
    `);
  });
});
