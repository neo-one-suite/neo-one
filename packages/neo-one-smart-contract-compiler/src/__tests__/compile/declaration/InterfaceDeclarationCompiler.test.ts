import { helpers } from '../../../__data__';

describe('InterfaceDeclarationCompiler', () => {
  test('Sanity Test: accessing invalid property results in error', async () => {
    await helpers.compileString(
      `
    var foo = {};

    if (foo.balk!== undefined) {
      // above line will throw TypeScript error
    }
      `,
      { type: 'error' },
    );
  });

  test('Create object given interface, using "as {type}"', async () => {
    await helpers.executeString(`
    interface Foo {
      bar: number;
      baz: string;
    }
    var foo = {} as Foo;

    if (foo.bar!== undefined) {
      throw 'Failure';
    }
      `);
  });

  // Currently unsupported, but valid syntax.
  test.skip('Create object given interface, using "<{type}>" ', async () => {
    await helpers.executeString(`

    interface Foo {
      bar: number;
      baz: string;
    }
    var bar = <Foo>{};

    if (bar.bar!== undefined) {
      throw 'Failure';
    }
      `);
  });
});
