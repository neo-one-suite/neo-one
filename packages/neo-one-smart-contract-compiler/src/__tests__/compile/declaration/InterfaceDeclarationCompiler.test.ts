import { helpers } from '../../../__data__';

describe('InterfaceDeclarationCompiler', () => {
  test('Interface type as value reports error', async () => {
    await helpers.compileString(
      `
      interface Foo {
        bar: string;
      }

      const foo = {} as Foo;

      if (!(foo instanceof Foo)) {
        throw 'Failure';
      }
    `,
      { type: 'error' },
    );
  });
});
