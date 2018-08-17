import { helpers } from '../../../__data__';
import { DiagnosticCode } from '../../../DiagnosticCode';

describe('FunctionDeclarationCompiler', () => {
  test('basic function', async () => {
    await helpers.executeString(`
      function addOne(x: number): number {
        return x + 1;
      }

      assertEqual(addOne(1), 2);
      assertEqual(addOne(2), 3);
    `);
  });

  test('2 functions', async () => {
    await helpers.executeString(`
      function addOne(x: number): number {
        return x + 1;
      }

      function addTwo(x: number): number {
        return x + 2;
      }

      function addThree(x: number): number {
        return addTwo(addOne(x));
      }

      if (addThree(1) !== 4) {
        throw 'Failure';
      }

      if (addThree(2) !== 5) {
        throw 'Failure';
      }
    `);
  });

  test('recursive + outer scope bound', async () => {
    await helpers.executeString(`
      let y = 0;
      function addSome(x: number): number {
        if (y === 3) {
          return x;
        }

        y += 1;
        return addSome(x + 1);
      }

      if (addSome(1) !== 4) {
        throw 'Failure';
      }

      if (addSome(1) !== 1) {
        throw 'Failure';
      }
    `);
  });

  test('arguments is new scope', async () => {
    await helpers.executeString(`
      const x = 3;
      function identity(x: number): number {
        return x;
      }

      if (identity(1) !== 1) {
        throw 'Failure';
      }

      if (identity(3) !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('declaration overloads', async () => {
    await helpers.executeString(`
      function unwrapNumberOrString(value: true): string;
      function unwrapNumberOrString(value: false): number;
      function unwrapNumberOrString(value: boolean): string | number {
        return value ? 'foo' : 0;
      }

      if (unwrapNumberOrString(true) !== 'foo') {
        throw 'Failure';
      }

      if (unwrapNumberOrString(false) !== 0) {
        throw 'Failure';
      }
    `);
  });

  test('bind parameters', async () => {
    await helpers.executeString(`
      function foo({ x = 5 }: { readonly x?: number } = { x: 10 }): number {
        return x;
      }

      if (foo() !== 10) {
        throw 'Failure';
      }

      if (foo({}) !== 5) {
        throw 'Failure';
      }

      if (foo({ x: 1 }) !== 1) {
        throw 'Failure';
      }
    `);
  });

  test('rest parameter', async () => {
    await helpers.executeString(`
      function foo(x: number, ...y: number[]): number[] {
        return y;
      }

      const [a, b, c] = foo(1, 2, 3, 4);

      if (a !== 2) {
        throw 'Failure';
      }

      if (b !== 3) {
        throw 'Failure';
      }

      if (c !== 4) {
        throw 'Failure';
      }
    `);
  });

  test('optional parameter', async () => {
    await helpers.executeString(`
      function foo(x?: number): number {
        return x === undefined ? 10 : x;
      }

      if (foo() !== 10) {
        throw 'Failure';
      }

      if (foo(1) !== 1) {
        throw 'Failure';
      }
    `);
  });

  test('spread arguments unsupported', async () => {
    helpers.compileString(
      `
      function foo(x: number, ...y: number[]): number[] {
        return y;
      }

      const x: [number, number, number, number] = [1, 2, 3, 4]
      const [a, b, c] = foo(...x);

      assertEqual(a, 2);
      assertEqual(b, 3);
      assertEqual(c, 4);
    `,
      { type: 'error', code: DiagnosticCode.GenericUnsupportedSyntax },
    );
  });
});
