import { helpers } from '../../../__data__';

describe('AsExpressionCompiler', () => {
  test('Create object given interface, using "as {type}"', async () => {
    await helpers.executeString(
      `
      interface Foo {
        readonly bar: number | undefined;
      }
      var foo = ({} as any) as Foo;

      if (foo.bar !== undefined) {
        throw 'Failure';
      }
    `,
      { ignoreWarnings: true },
    );
  });
});
