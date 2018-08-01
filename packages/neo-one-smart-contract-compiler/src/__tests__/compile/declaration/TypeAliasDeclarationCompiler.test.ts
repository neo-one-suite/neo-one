import { helpers } from '../../../__data__';

describe('TypeAliasDeclarationCompiler', () => {
  test('type alias does not emit', async () => {
    await helpers.executeString(`
      type Foo = {
        bar: string;
      }

      const foo: Foo = { bar: 'bar' };

      if (foo.bar !== 'bar') {
        throw 'Failure';
      }
    `);
  });
});
