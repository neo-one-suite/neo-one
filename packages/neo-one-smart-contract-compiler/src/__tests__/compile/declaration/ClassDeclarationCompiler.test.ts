import { helpers } from '../../../__data__';

describe('ClassDeclarationCompiler', () => {
  test('basic class with initializer', async () => {
    await helpers.executeString(`
      interface X {
        x: string;
      }
      class Foo implements X {
        x: string = 'bar';
      }

      const f = new Foo();
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with constructor', async () => {
    await helpers.executeString(`
      class Foo {
        x: string;

        constructor() {
          this.x = 'bar';
        }
      }

      const f = new Foo();
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with constructor arguments', async () => {
    await helpers.executeString(`
      class Foo {
        x: string;

        constructor(x: string) {
          this.x = x;
        }
      }

      const f = new Foo('bar');
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with default constructor arguments', async () => {
    await helpers.executeString(`
      class Foo {
        x: string;

        constructor(x: string = 'bar') {
          this.x = x;
        }
      }

      const f = new Foo();
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with optional constructor arguments', async () => {
    await helpers.executeString(`
      const bar: unique symbol = Symbol.for('x');
      const baz: unique symbol = Symbol.for('baz');
      interface Bar {}
      class Foo implements Bar {
        public [bar]: string | undefined;
        public [baz]: string = 'baz';

        constructor(x?: string) {
          this[bar] = x;
        }
      }

      const f = new Foo();
      assertEqual(f[bar], undefined);
      assertEqual(f[baz], 'baz');
    `);
  });

  test('basic class with method', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        ['bar'](): string {
          return this.x;
        }
      }

      const f = new Foo();
      if (f.bar() !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with ECMAScript private member, inaccessible', async () => {
    await helpers.compileString(
      `
      class Foo {
        #x: string = 'bar';

        ['bar'](): string {
          return this.#x;
        }
      }

      const f = new Foo();
      f.#x;
    `,
      { type: 'error' },
    );
  });

  test('ECMAScript private member, no public modifier allowed', async () => {
    await helpers.compileString(
      `
      class Foo {
        public #x: string = 'bar';
      }
    `,
      { type: 'error' },
    );
  });

  test('ECMAScript private member, no private modifier allowed', async () => {
    await helpers.compileString(
      `
      class Foo {
        private #x: string = 'bar';
      }
    `,
      { type: 'error' },
    );
  });

  test('ECMAScript private member, extends does not override private member', async () => {
    await helpers.executeString(
      `
      class Foo {
        #x: string = 'bar';

        getX(): string {
          return this.#x;
        }
      }

      class Bar extends Foo {
        #x: string = 'baz';

        getX(): string {
          return this.#x;
        }
      }

      const foo = new Foo();
      const bar = new Bar();

      assertEqual(foo.getX(), 'bar');
      assertEqual(bar.getX(), 'baz');
    `,
    );
  });

  test('basic class with get accessor', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        public get bar() {
          return this.x;
        }
      }

      const f = new Foo();
      if (f.bar !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with get symbol accessor', async () => {
    await helpers.executeString(`
      const bar = Symbol.for('bar');
      class Foo {
        x: string = 'bar';

        public get [bar](): string {
          return this.x;
        }
      }

      const f = new Foo();
      if (f[bar] !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with set accessor', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        public set bar(x: string) {
          this.x = x;
        }
      }

      const f = new Foo();
      if (f.x !== 'bar') {
        throw 'Failure';
      }

      f.bar = 'baz';
      if ((f.x as string) !== 'baz') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with set symbol accessor', async () => {
    await helpers.executeString(`
      const bar = Symbol.for('bar');
      class Foo {
        x: string = 'bar';

        public set [bar](x: string) {
          this.x = x;
        }
      }

      const f = new Foo();
      if (f.x !== 'bar') {
        throw 'Failure';
      }

      f[bar] = 'baz';
      if ((f.x as string) !== 'baz') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with get/set accessor', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        public get bar(): string {
          return this.x;
        }

        public set bar(x: string) {
          this.x = x;
        }
      }

      const f = new Foo();
      if (f.bar !== 'bar') {
        throw 'Failure';
      }

      f.bar = 'baz';
      if (f.bar !== 'baz') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with get/set symbol accessor', async () => {
    await helpers.executeString(`
      const bar = Symbol.for('bar');
      class Foo {
        x: string = 'bar';

        public get [bar](): string {
          return this.x;
        }

        public set [bar](x: string) {
          this.x = x;
        }
      }

      const f = new Foo();
      if (f[bar] !== 'bar') {
        throw 'Failure';
      }

      f[bar] = 'baz';
      if (f[bar] !== 'baz') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with method calling another instance method', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        bar(): string {
          return this.x;
        }

        baz(): string {
          return this.bar();
        }
      }

      const f = new Foo();
      if (f.baz() !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with inherited property', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';
      }

      class Baz extends Foo {
      }

      const f = new Baz();
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with inherited method', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        bar(): string {
          return this.x;
        }
      }

      class Baz extends Foo {
      }

      const f = new Baz();
      if (f.bar() !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with inherited symbol method', async () => {
    await helpers.executeString(`
      const bar = Symbol.for('bar');
      class Foo {
        x: string = 'bar';

        [bar](): string {
          return this.x;
        }
      }

      class Baz extends Foo {
      }

      const f = new Baz();
      if (f[bar]() !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with overriden property', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';
      }

      class Baz extends Foo {
        x: string = 'baz';
      }

      const f = new Baz();
      if (f.x !== 'baz') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with overriden method', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        bar(): string {
          return this.x;
        }
      }

      class Baz extends Foo {
        bar(): string {
          return 'baz';
        }
      }

      const f = new Baz();
      if (f.bar() !== 'baz') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with super call', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        public bar(): string {
          return this.x;
        }
      }

      class Baz extends Foo {
        public bar(): string {
          return super.bar() + 'baz';
        }
      }

      const f = new Baz();
      if (f.bar() !== 'barbaz') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with super call and void return', async () => {
    await helpers.executeString(`
      class Foo {
        public x: string = 'bar';

        public setQux(): void {
          this.x = 'qux';
        }

        public bar(): string {
          this.setQux();
          return this.x;
        }
      }

      class Baz extends Foo {
        public bar(): string {
          return super.bar() + 'baz';
        }
      }

      const f = new Baz();
      if (true) {
        f.setQux();
        if (f.bar() !== 'quxbaz') {
          throw 'Failure';
        }
      }
    `);
  });

  test('static methods and properties', async () => {
    await helpers.executeString(`
      class Foo {
        private static bInternal: string = 'b';
        public static getA(): string {
          return 'a';
        }

        public static get b(): string {
          return this.bInternal;
        }

        public static set b(value: string) {
          this.bInternal = value;
        }
      }

      class Bar extends Foo {
        public static get c(): string {
          return 'c';
        }
      }

      class Qux extends Bar {
        public static getA(): string {
          return super.getA() + 'c';
        }
      }

      class Baz extends Bar {
        public static getA(): string {
          return super.getA() + super.b + super.c;
        }
      }

      if (Foo.getA() !== 'a') {
        throw 'Failure';
      }

      if (Bar.getA() !== 'a') {
        throw 'Failure';
      }

      if (Bar.c !== 'c') {
        throw 'Failure';
      }

      if (Baz.getA() !== 'abc') {
        throw 'Failure';
      }

      if (Qux.getA() !== 'ac') {
        throw 'Failure';
      }
    `);
  });

  test('decorators', async () => {
    await helpers.compileString(
      `
      function verify(target: any, propertyKey: string, descriptor: any): void {
        throw new Error('This should be transpiled.');
      }

      class Foo {
        @verify
        public bar(): number {
          return 10;
        }
      }
    `,
      { type: 'error' },
    );
  });
});
