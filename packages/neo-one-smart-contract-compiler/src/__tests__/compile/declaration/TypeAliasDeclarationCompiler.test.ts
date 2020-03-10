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

  test('recursive type alias does not emit', async () => {
    await helpers.executeString(`
      type Json =
        | string
        | number
        | boolean
        | null
        | { [property: string]: Json }
        | Json[];

      type VirtualNode =
        | string
        | [string, { [key: string]: any }, ...VirtualNode[]];

      const myNode: VirtualNode =
        ["div", { id: "parent" },
          ["div", { id: "first-child" }, "I'm the first child"],
          ["div", { id: "second-child" }, "I'm the second child"]
        ];
    `);
  });
});
