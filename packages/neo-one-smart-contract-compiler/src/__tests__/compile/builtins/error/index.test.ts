import { helpers } from '../../../../__data__';

describe('Error', () => {
  test('can be implemented', async () => {
    await helpers.executeString(`
      class MyError implements Error {
        public readonly message: string = 'foo';
      }

      const x = new MyError();
      assertEqual(x.message, 'foo');
    `);
  });

  test('can be extended and instanceof', async () => {
    await helpers.executeString(`
      class MyError extends Error {
        constructor() {
          super('foo');
        }
      }

      const x = new MyError();
      assertEqual(x.message, 'foo');
      assertEqual(x instanceof Error, true);
    `);
  });

  test('can be constructed', async () => {
    await helpers.executeString(`
      const x = new Error('foo');
      assertEqual(x.message, 'foo');
      assertEqual(x instanceof Error, true);
    `);
  });
});
