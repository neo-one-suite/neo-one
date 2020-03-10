import { helpers } from '../../../__data__';

describe('CallExpressionCompiler', () => {
  test('call no arguments', async () => {
    await helpers.executeString(`
      const foo = () => 2;
      if (foo() !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('call with arguments', async () => {
    await helpers.executeString(`
      const foo = (x: number): number => x;
      if (foo(2) !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('call with rest arguments', async () => {
    await helpers.executeString(`
      const foo = (...x: number[]): number => x.reduce((acc, value) => acc + value, 0);

      assertEqual(foo(), 0);
      assertEqual(foo(2), 2);
      assertEqual(foo(2, 3), 5);

      const tuple = [2, 3];
      assertEqual(foo(...tuple), 5);
      assertEqual(foo(1, ...tuple), 6);
    `);
  });

  test('call with arguments and rest arguments', async () => {
    await helpers.executeString(`
      const foo = (x: number, ...y: number[]): number => y.reduce((acc, value) => acc + value, x);

      assertEqual(foo(10), 10);
      assertEqual(foo(10, 2), 12);
      assertEqual(foo(10, 2, 3), 15);

      const tuple = [2, 3];
      assertEqual(foo(10, ...tuple), 15);
      assertEqual(foo(10, 1, ...tuple), 16);
    `);
  });

  test('call that throws', async () => {
    await helpers.executeString(`
      const foo = () => {
        throw 'Should Be Caught';
      }

      let failed = false;
      try {
        foo();
      } catch (error) {
        failed = true;
      }

      if (!failed) {
        throw 'Failure';
      }
    `);
  });

  test('property call', async () => {
    await helpers.executeString(`
      const foo = {
        x: 1,
        y(): number {
          return this.x;
        }
      };

      assertEqual(foo.y(), 1);
    `);
  });

  test('nested property call', async () => {
    await helpers.executeString(`
      const foo = {
        x: 1,
        y: {
          z(): number {
            return 13;
          }
        }
      };

      assertEqual(foo.y.z(), 13);
    `);
  });

  test('method call', async () => {
    await helpers.executeString(`
      class Foo {
        private x: number = 0;

        public bar(x: number): number {
          this.setX(x);
          return this.getX() + 3;
        }

        private setX(x: number): void {
          this.x = x;
        }

        private getX(): number {
          return this.x;
        }
      }

      const foo = new Foo();
      assertEqual(foo.bar(1), 4);
      assertEqual(foo.bar(2), 5);
    `);
  });

  test('super constructor call', async () => {
    await helpers.executeString(`
      class Foo {
        public readonly x: number;

        constructor(x: number) {
          this.x = x;
        }
      }

      class Bar extends Foo {
        public readonly y: number;

        constructor(x: number, y: number) {
          super(x);
          this.y = y;
        }
      }

      const bar = new Bar(1, 2);
      if (bar.x !== 1) {
        throw 'Failure';
      }

      if (bar.y !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('super method call', async () => {
    await helpers.executeString(`
      class Foo {
        public getX(): number {
          return 1;
        }
      }

      class Bar extends Foo {
        public getX(): number {
          return super.getX() + 1;
        }
      }

      class Baz extends Bar {
        public getX(): number {
          return super.getX() + 1;
        }
      }

      const baz = new Baz();
      if (baz.getX() !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('method call', async () => {
    await helpers.executeString(`
      class Foo {
        public addAll(x: number, y: number, z: number): number {
          return x + y + z;
        }
      }

      const foo = new Foo();

      if (foo.addAll(1, 2, 3) !== 6) {
        throw 'Failure';
      }
    `);
  });

  test('method call - element access', async () => {
    await helpers.executeString(`
      class Foo {
        public addAll(x: number, y: number, z: number): number {
          return x + y + z;
        }
      }

      const foo = new Foo();

      if (foo['addAll'](1, 2, 3) !== 6) {
        throw 'Failure';
      }
    `);
  });

  test('object with symbol keys', async () => {
    await helpers.executeString(`
      const a = Symbol.for('hello');
      const x = { [a]: () => 1 };

      assertEqual(x[a](), 1);
    `);
  });

  test('object with number keys', async () => {
    await helpers.executeString(`
      const a = 0;
      const x = { [a]: () => 1 };

      assertEqual(x[a](), 1);
    `);
  });

  test('array with functions', async () => {
    await helpers.executeString(`
      const x: [() => number, number] = [function(this: Array<number>) { return this[1]; }, 10];

      assertEqual(x[0](), 10);
    `);
  });

  test('Symbol', async () => {
    await helpers.executeString(`
      const a: symbol = Symbol.for('hello');
      const b: symbol = Symbol.for('hello');

      if (a !== b) {
        throw 'Failure';
      }
    `);
  });

  test('[0, 1, 2].map()', async () => {
    await helpers.executeString(`
      interface Arr<T> {
        map<U>(callbackfn: (value: T, index: number) => U): U[];
      }
      const x: Arr<number> | Array<number> = [1, 2, 3] as Arr<number> | Array<number>;

      const y = x.map((value) => value + 1);

      assertEqual(y[0], 2);
      assertEqual(y[1], 3);
      assertEqual(y[2], 4);
    `);
  });

  test('[0, 1, 2]["map"]()', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];

      const y = x['map']((value) => value + 1);

      assertEqual(y[0], 2);
      assertEqual(y[1], 3);
      assertEqual(y[2], 4);
    `);
  });

  test('array[Symbol.iterator]()', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];

      assertEqual(x[Symbol.iterator]() !== undefined, true);
    `);
  });

  test('optional chain - element access with symbol - undefined', async () => {
    await helpers.executeString(`
        const foo = Symbol.for('hello');
        const bar: { [foo]: (() => number) | null | undefined } = { [foo]: undefined } as unknown as { [foo]: (() => number) | null | undefined };

        assertEqual(bar[foo]?.(), undefined);
      `);
  });

  test('optional chain - element access with symbol - null', async () => {
    await helpers.executeString(`
        const foo = Symbol.for('hello');
        const bar: { [foo]: (() => number) | null | undefined } = { [foo]: null } as unknown as { [foo]: (() => number) | null | undefined };

        assertEqual(bar[foo]?.(), undefined);
      `);
  });

  test('optional chain - element access with symbol - defined', async () => {
    await helpers.executeString(`
        const foo = Symbol.for('hello');
        const bar: { [foo]: (() => number) | null | undefined } = { [foo]: () => 10 } as unknown as { [foo]: (() => number) | null | undefined };

        assertEqual(bar[foo]?.(), 10);
      `);
  });

  test('optional chain - element access with symbol - nested undefined', async () => {
    await helpers.executeString(`
        const foo = Symbol.for('hello');
        const baz = Symbol.for('world');
        const bar: { [foo]: { [baz]: (() => number) | null | undefined } } = { [foo]: { [baz]: undefined } } as unknown as { [foo]: { [baz]: (() => number) | null | undefined } };

        assertEqual(bar[foo][baz]?.(), undefined);
      `);
  });

  test('optional chain - element access with symbol - nested null', async () => {
    await helpers.executeString(`
        const foo = Symbol.for('hello');
        const baz = Symbol.for('world');
        const bar: { [foo]: { [baz]: (() => number) | null | undefined } } = { [foo]: { [baz]: null } } as unknown as { [foo]: { [baz]: (() => number) | null | undefined } };

        assertEqual(bar[foo][baz]?.(), undefined);
      `);
  });

  test('optional chain - element access with symbol - nested defined', async () => {
    await helpers.executeString(`
        const foo = Symbol.for('hello');
        const baz = Symbol.for('world');
        const bar: { [foo]: { [baz]: (() => number) | null | undefined } } = { [foo]: { [baz]: () => 10 } } as unknown as { [foo]: { [baz]: (() => number) | null | undefined } };

        assertEqual(bar[foo][baz]?.(), 10);
      `);
  });

  test('optional chain - element access with number - undefined', async () => {
    await helpers.executeString(`
        const foo = 0;
        const bar: { [foo]: (() => number) | null | undefined } = { [foo]: undefined } as unknown as { [foo]: (() => number) | null | undefined };

        assertEqual(bar[foo]?.(), undefined);
      `);
  });

  test('optional chain - element access with number - null', async () => {
    await helpers.executeString(`
        const foo = 0;
        const bar: { [foo]: (() => number) | null | undefined } = { [foo]: null } as unknown as { [foo]: (() => number) | null | undefined };

        assertEqual(bar[foo]?.(), undefined);
      `);
  });

  test('optional chain - element access with number - defined', async () => {
    await helpers.executeString(`
        const foo = 0;
        const bar: { [foo]: (() => number) | null | undefined } = { [foo]: () => 10 } as unknown as { [foo]: (() => number) | null | undefined };

        assertEqual(bar[foo]?.(), 10);
      `);
  });

  test('optional chain - element access with number - nested undefined', async () => {
    await helpers.executeString(`
        const foo = 0;
        const baz = 2;
        const bar: { [foo]: { [baz]: (() => number) | null | undefined } } = { [foo]: { [baz]: undefined } } as unknown as { [foo]: { [baz]: (() => number) | null | undefined } };

        assertEqual(bar[foo][baz]?.(), undefined);
      `);
  });

  test('optional chain - element access with number - nested null', async () => {
    await helpers.executeString(`
        const foo = 0;
        const baz = 2;
        const bar: { [foo]: { [baz]: (() => number) | null | undefined } } = { [foo]: { [baz]: null } } as unknown as { [foo]: { [baz]: (() => number) | null | undefined } };

        assertEqual(bar[foo][baz]?.(), undefined);
      `);
  });

  test('optional chain - element access with number - nested defined', async () => {
    await helpers.executeString(`
        const foo = 0;
        const baz = 2;
        const bar: { [foo]: { [baz]: (() => number) | null | undefined } } = { [foo]: { [baz]: () => 10 } } as unknown as { [foo]: { [baz]: (() => number) | null | undefined } };

        assertEqual(bar[foo][baz]?.(), 10);
      `);
  });

  test('optional chain - element access with string - undefined', async () => {
    await helpers.executeString(`
        const bar: { foo: (() => number) | null | undefined } = { foo: undefined } as unknown as { foo: (() => number) | null | undefined };

        assertEqual(bar['foo']?.(), undefined);
      `);
  });

  test('optional chain - element access with string - null', async () => {
    await helpers.executeString(`
        const bar: { foo: (() => number) | null | undefined } = { foo: null } as unknown as { foo: (() => number) | null | undefined };

        assertEqual(bar['foo']?.(), undefined);
      `);
  });

  test('optional chain - element access with string - defined', async () => {
    await helpers.executeString(`
        const bar: { foo: (() => number) | null | undefined } = { foo: () => 10 } as unknown as { foo: (() => number) | null | undefined };

        assertEqual(bar['foo']?.(), 10);
      `);
  });

  test('optional chain - element access with string - nested undefined', async () => {
    await helpers.executeString(`
        const bar: { foo: { baz: (() => number) | null | undefined } } = { foo: { baz: undefined } } as unknown as { foo: { baz: (() => number) | null | undefined } };

        assertEqual(bar['foo']['baz']?.(), undefined);
      `);
  });

  test('optional chain - element access with string - nested null', async () => {
    await helpers.executeString(`
    const bar: { foo: { baz: (() => number) | null | undefined } } = { foo: { baz: null } } as unknown as { foo: { baz: (() => number) | null | undefined } };

        assertEqual(bar['foo']['baz']?.(), undefined);
      `);
  });

  test('optional chain - element access with string - nested defined', async () => {
    await helpers.executeString(`
        const bar: { foo: { baz: (() => number) | null | undefined } } = { foo: { baz: () => 10 } } as unknown as { foo: { baz: (() => number) | null | undefined } };

        assertEqual(bar['foo']['baz']?.(), 10);
      `);
  });

  test('optional chain - call expression - undefined', async () => {
    await helpers.executeString(`
        const bar: (() => number) | null | undefined = null as unknown as (() => number) | null | undefined;

        assertEqual(bar?.(), undefined);
      `);
  });

  test('optional chain - call expression - null', async () => {
    await helpers.executeString(`
        const bar: (() => number) | null | undefined = undefined as unknown as (() => number) | null | undefined;

        assertEqual(bar?.(), undefined);
      `);
  });

  test('optional chain - call expression - defined', async () => {
    await helpers.executeString(`
        const bar: (() => number) | null | undefined = (() => 10) as unknown as (() => number) | null | undefined;

        assertEqual(bar?.(), 10);
      `);
  });

  test('optional chain - property access - nested undefined', async () => {
    await helpers.executeString(`
        const bar: { foo: (() => number) | null | undefined } = { foo: undefined } as unknown as { foo: (() => number) | null | undefined };

        assertEqual(bar.foo?.(), undefined);
      `);
  });

  test('optional chain - property access - nested null', async () => {
    await helpers.executeString(`
        const bar: { foo: (() => number) | null | undefined } = { foo: null } as unknown as { foo: (() => number) | null | undefined };

        assertEqual(bar.foo?.(), undefined);
      `);
  });

  test('optional chain - property access - nested defined', async () => {
    await helpers.executeString(`
        const bar: { foo: (() => number) | null | undefined } = { foo: () => 10 } as unknown as { foo: (() => number) | null | undefined };

        assertEqual(bar.foo?.(), 10);
      `);
  });

  test('optional chain - property access - double nested undefined', async () => {
    await helpers.executeString(`
        const bar: { foo: { baz: (() => number) | null | undefined } } = { foo: { baz: undefined } } as unknown as { foo: { baz: (() => number) | null | undefined } };

        assertEqual(bar.foo.baz?.(), undefined);
      `);
  });

  test('optional chain - property access - double nested null', async () => {
    await helpers.executeString(`
    const bar: { foo: { baz: (() => number) | null | undefined } } = { foo: { baz: null } } as unknown as { foo: { baz: (() => number) | null | undefined } };

        assertEqual(bar.foo.baz?.(), undefined);
      `);
  });

  test('optional chain - property access - double nested defined', async () => {
    await helpers.executeString(`
        const bar: { foo: { baz: (() => number) | null | undefined } } = { foo: { baz: () => 10 } } as unknown as { foo: { baz: (() => number) | null | undefined } };

        assertEqual(bar.foo.baz?.(), 10);
      `);
  });
});
