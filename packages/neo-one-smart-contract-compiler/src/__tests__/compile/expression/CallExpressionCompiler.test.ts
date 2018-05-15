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
      const foo = (x: number) => x;
      if (foo(2) !== 2) {
        throw 'Failure';
      }
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

      if (foo.y() !== 1) {
        throw 'Failure';
      }
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

        private setX(x: number): number {
          this.x = x;
        }

        private getX(): number {
          return this.x;
        }
      }

      const foo = new Foo();
      if (foo.bar(1) !== 4) {
        throw 'Failure';
      }

      if (foo.bar(2) !== 5) {
        throw 'Failure';
      }
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
});
