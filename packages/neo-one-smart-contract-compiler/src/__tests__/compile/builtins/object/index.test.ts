import { helpers } from '../../../../__data__';

describe('Object', () => {
  test('can be implemented', async () => {
    await helpers.executeString(`
      class MyObject implements Object {
      }
    `);
  });

  test('cannot be extended', async () => {
    await helpers.compileString(
      `
      class MyObject extends Object {
      }
    `,
      { type: 'error' },
    );
  });

  test('cannot match shape and pass to function', async () => {
    await helpers.compileString(
      `
      const Obj = {
        keys: (o: {}): string[] => [],
      }

      const x = (foo: typeof Object) => {
        // do nothing
      }

      x(Obj);
    `,
      { type: 'error' },
    );
  });

  test('can be referenced and passed to functions', async () => {
    await helpers.executeString(`
      const x: [typeof Object] = [Object];

      const foo = (value: [typeof Object]) => {
        const x = value[0].keys({ a: 0, b: 1 });
        assertEqual(x[0], 'a');
        assertEqual(x[1], 'b');
      };

      foo(x);
    `);
  });
});
