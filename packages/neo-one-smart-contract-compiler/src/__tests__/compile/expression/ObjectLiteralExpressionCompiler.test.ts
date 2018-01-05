import { helpers } from '../../../__data__';

describe('ObjectLiteralExpressionCompiler', () => {
  test('empty object', async () => {
    await helpers.executeString(`
      const x = {};
    `);
  });

  test('object with property', async () => {
    await helpers.executeString(`
      const x = {
        foo: 3 + 2,
      };

      if (x.foo !== 5) {
        throw 'Failure';
      }
    `);
  });

  test('object with short-hand property', async () => {
    await helpers.executeString(`
      const foo = 3 + 2;
      const x = { foo };

      if (x.foo !== 5) {
        throw 'Failure';
      }
    `);
  });

  test('object with method', async () => {
    await helpers.executeString(`
      const x = {
        foo() {
          return 3 + 2;
        }
      };

      if (x.foo() !== 5) {
        throw 'Failure';
      }
    `);
  });
});
