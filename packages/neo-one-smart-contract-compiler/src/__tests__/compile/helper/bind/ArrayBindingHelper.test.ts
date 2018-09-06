import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('ArrayBindingHelper', () => {
  describe('variable', () => {
    test('simple', async () => {
      await helpers.executeString(`
        const [a, b, c, ...rest] = [1, 2, 3, 4];

        assertEqual(a, 1);
        assertEqual(b, 2);
        assertEqual(c, 3);
        assertEqual(rest[0], 4);
      `);
    });

    test('non-array', async () => {
      helpers.compileString(
        `
        interface Arr {
          [Symbol.iterator](): IterableIterator<T>;
        }
        const x: Arr = {}  as Arr;

        const [a, b] = x;

        assertEqual(a, 0);
        assertEqual(b, 1);
      `,
        { type: 'error', code: DiagnosticCode.UnsupportedSyntax },
      );
    });

    test('complex', async () => {
      await helpers.executeString(`
        const s = Symbol.for('s');
        const t = Symbol.for('t');
        const foo: [number, [number, { x: number, a?: number, c: number, [s]: number, ['d']: number, 'e': number, 0: number, [t]: { ta: number } }, number?], number, number] =
          [1, [2, { x: 3, c: 8, [s]: 9, ['d']: 10, 'e': 11, 0: 12, [t]: { ta: 13 } }], 4, 5];
        const [x, [y, { x: z, a = 6, [s]: ss, ['d']: d, 'e': e, 0: f, [t]: { ta: g }, ...restObject }, b = 7], ...rest] = foo;
        if (x !== 1) {
          throw 'Failure';
        }

        if (y !== 2) {
          throw 'Failure';
        }

        if (z !== 3) {
          throw 'Failure';
        }

        if (a !== 6) {
          throw 'Failure';
        }

        if (b !== 7) {
          throw 'Failure';
        }

        if (rest.length !== 2) {
          throw 'Failure';
        }

        if (rest[0] !== 4) {
          throw 'Failure';
        }

        if (rest[1] !== 5) {
          throw 'Failure';
        }

        if (restObject.c !== 8) {
          throw 'Failure';
        }

        if (ss !== 9) {
          throw 'Failure';
        }

        if (d !== 10) {
          throw 'Failure';
        }

        if (e !== 11) {
          throw 'Failure';
        }

        if (f !== 12) {
          throw 'Failure';
        }

        if (g !== 13) {
          throw 'Failure';
        }
      `);
    });
  });

  describe('function parameter', () => {
    test('simple', async () => {
      await helpers.executeString(`
        const value = [1, 2, 3];

        function run([a, b, ...rest]: typeof value) {
          assertEqual(a, 1);
          assertEqual(b, 2);
          assertEqual(rest.length, 1);
          assertEqual(rest[0], 3);
        }

        run(value);
      `);
    });
  });

  describe('arrow function parameter', () => {
    test('simple', async () => {
      await helpers.executeString(`
        const value = [1, 2, 3];

        const run = ([a, b, ...rest]: typeof value) => {
          assertEqual(a, 1);
          assertEqual(b, 2);
          assertEqual(rest.length, 1);
          assertEqual(rest[0], 3);
        }

        run(value);
      `);
    });
  });

  describe('constructor parameter', () => {
    test('simple', async () => {
      await helpers.executeString(`
        const value = [1, 2, 3];

        class Foo {
          constructor([a, b, ...rest]: typeof value) {
            assertEqual(a, 1);
            assertEqual(b, 2);
            assertEqual(rest.length, 1);
            assertEqual(rest[0], 3);
          }
        }

        new Foo(value);
      `);
    });
  });

  describe('method parameter', () => {
    test('simple', async () => {
      await helpers.executeString(`
        const value = [1, 2, 3];

        class Foo {
          public foo([a, b, ...rest]: typeof value) {
            assertEqual(a, 1);
            assertEqual(b, 2);
            assertEqual(rest.length, 1);
            assertEqual(rest[0], 3);
          }
        }

        new Foo().foo(value);
      `);
    });
  });
});
