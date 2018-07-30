import { helpers } from '../../../__data__';

// as borrowed from: InterfaceDeclarationCompiler.test
describe('AsExpressionCompiler', () => {
  test('Create object given interface, using "as {type}"', async () => {
    await helpers.executeString(`
    interface Foo {
      bar: number;
    }
    var foo = {} as Foo;

    if (foo.bar!== undefined) {
      throw 'Failure';
    }
      `);
  });
});
