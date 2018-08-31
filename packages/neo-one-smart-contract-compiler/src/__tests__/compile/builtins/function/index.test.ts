import { helpers } from '../../../../__data__';

describe('Function', () => {
  test('can be implemented', async () => {
    await helpers.executeString(`
      class MyFunction implements Function {
      }
    `);
  });

  test('cannot be extended', async () => {
    helpers.compileString(
      `
      class MyFunction extends Function {
      }
    `,
      { type: 'error' },
    );
  });

  test('can be referenced and passed to functions', async () => {
    await helpers.executeString(`
      const x: [typeof Function] = [Function];

      const foo = (value: [typeof Function]) => {
        // do nothing
      };

      foo(x);
    `);
  });
});
