import { helpers } from '../../../../__data__';

describe('Boolean', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      class MyBoolean implements Boolean {
      }
    `,
      { type: 'error' },
    );
  });

  test('cannot be extended', async () => {
    await helpers.compileString(
      `
      class MyBoolean extends Boolean {
      }
    `,
      { type: 'error' },
    );
  });

  test('can be referenced and passed to functions', async () => {
    await helpers.executeString(`
      const x = { x: Boolean };

      const foo = (value: { x: typeof Boolean }) => {
        // do nothing
      };

      foo(x);
    `);
  });
});
