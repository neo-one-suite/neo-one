import { helpers } from '../../../__data__';

describe('NewExpressionCompiler', () => {
  test('Create class instance using new', async () => {
    await helpers.executeString(`
      class Foo {
        public readonly bar: string = 'foo';
      }

      const foo = new Foo();

      if (foo.bar !== 'foo') {
        throw 'Failure';
      }
    `);
  });
});
