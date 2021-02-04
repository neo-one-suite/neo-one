import { helpers } from '../../../../__data__';

describe('Symbol', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      class MySymbol implements Symbol {
      }
    `,
      { type: 'error' },
    );
  });

  test('cannot be extended', async () => {
    await helpers.compileString(
      `
      class MySymbol extends Symbol {
      }
    `,
      { type: 'error' },
    );
  });

  test('can be referenced and passed to functions', async () => {
    await helpers.executeString(`
      const x: [typeof Symbol] = [Symbol];

      const foo = (value: [typeof Symbol]) => {
        // do nothing
      };

      foo(x);
    `);
  });
});
