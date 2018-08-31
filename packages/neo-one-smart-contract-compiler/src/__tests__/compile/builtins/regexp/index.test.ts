import { helpers } from '../../../../__data__';

describe('RegExp', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      class MyRegExp implements RegExp {
      }
    `,
      { type: 'error' },
    );
  });

  test('cannot be extended', async () => {
    helpers.compileString(
      `
      class MyRegExp extends RegExp {
      }
    `,
      { type: 'error' },
    );
  });

  test('can be referenced and passed to functions', async () => {
    await helpers.executeString(`
      const x: [typeof RegExp] = [RegExp];

      const foo = (value: [typeof RegExp]) => {
        // do nothing
      };

      foo(x);
    `);
  });
});
