import { helpers } from '../../../__data__';

describe('ObjectLiteralExpressionCompiler', () => {
  test('empty object', async () => {
    await helpers.executeString(`
      ({});
      const x = {};
    `);
  });

  test('object with property', async () => {
    await helpers.executeString(`
      const x = {
        foo: 3 + 2,
      };

      assertEqual(x.foo, 5);
    `);
  });

  test('object with numeric property', async () => {
    await helpers.executeString(`
      const x = {
        0: 3 + 2,
      };

      assertEqual(x['0'], 5);
    `);
  });

  test('object with symbol property', async () => {
    await helpers.executeString(`
      const foo = Symbol.for('foo');
      const x = {
        [foo]: 3 + 2,
      };

      assertEqual(x[foo], 5);
    `);
  });

  test('object with short-hand property', async () => {
    await helpers.executeString(`
      const foo = 3 + 2;
      const x = { foo };

      assertEqual(x.foo, 5);
    `);
  });

  test('object with method', async () => {
    await helpers.executeString(`
      const x = {
        'foo'() {
          return 3 + 2;
        }
      };

      assertEqual(x.foo(), 5);
    `);
  });

  test('object with getter', async () => {
    await helpers.executeString(`
      const foo = 'foo';
      const x = {
        get [foo](): number {
          return 3 + 2;
        },
        set bar(value: string) {
          // do nothing
        }
      };

      assertEqual(x[foo], 5);
    `);
  });

  test('object with getter and setter', async () => {
    await helpers.executeString(`
      const foo = Symbol.for('foo');
      const x = {
        f: 3,
        get [foo](): number {
          return this.f;
        },
        set [foo](value: number) {
          this.f = value;
        },
      };

      assertEqual(x[foo], 3);
      x[foo] = 5;
      assertEqual(x[foo], 5);
    `);
  });

  test('object with spread', async () => {
    await helpers.executeString(`
      const y = {
        a: 0,
        get f(): number {
          return 4;
        },
      };
      const z = {
        a: 1,
      };
      const x = {
        ...z,
        f: 3,
        ...y,
      };

      assertEqual(x.a, 0);
      assertEqual(x.f, 4);
    `);
  });

  test('private field identifier fails outside class', async () => {
    helpers.compileString(
      `
      const y = {
        a: 0,
        #b: 10,
        get f(): number {
          return 4;
        },
      };
    `,
      { type: 'error' },
    );
  });
});
