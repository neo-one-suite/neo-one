import { helpers } from '../../../../__data__';

describe('Error', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      class MyError implements Error {
        public readonly message: string = 'foo';
      }
    `,
      { type: 'error' },
    );
  });

  test('cannot be extended', async () => {
    await helpers.compileString(
      `
      class MyError extends Error {
        public readonly message: string = 'foo';
      }
    `,
      { type: 'error' },
    );
  });

  test('cannot be mixin extended complex', async () => {
    await helpers.compileString(
      `
      const foo = (value: typeof Error) => {
        class MyMyError extends value {}

        return MyMyError;
      }

      class MyError extends foo(Error) {
        public readonly message: string = 'foo';
      }
    `,
      { type: 'error' },
    );
  });

  test.skip('cannot be mixin extended complex', async () => {
    await helpers.compileString(
      `
      const foo = (value: typeof Error) => {
        class MyMyError extends value {}

        return MyMyError;
      }

      const x = Error;
      class MyError extends foo(x) {
        public readonly message: string = 'foo';
      }
    `,
      { type: 'error' },
    );
  });

  test('can be constructed and instanceof', async () => {
    await helpers.executeString(`
      new Error('foo');
      const x = new Error('foo');
      assertEqual(x.message, 'foo');
      assertEqual(x instanceof Error, true);
    `);
  });

  test('can be constructed without string', async () => {
    await helpers.executeString(`
      new Error();
      const x = new Error();
      assertEqual(x.message, '');
      assertEqual(x instanceof Error, true);
    `);
  });
});
