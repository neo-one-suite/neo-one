import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array', () => {
  test('can check instanceof', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3]

      x instanceof Array;
      assertEqual(x instanceof Array, true);
    `);
  });

  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      class MyArray implements Array<number> {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      const x = Array;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('can be unambiguously referenced - call', async () => {
    await helpers.executeString(`
      const foo = <T>(value: Array<T>): number => value.length;
      const x = [1, 2, 3]

      assertEqual(foo(x), 3);
    `);
  });

  test('can be unambiguously referenced - call union parameter', async () => {
    await helpers.executeString(`
      interface Arr {
        readonly length: number;
      }
      const foo = <T>(value: Array<T> | Arr): number => value.length;
      const x = [1, 2, 3]

      assertEqual(foo(x), 3);
    `);
  });

  test('cannot be ambiguously referenced - call', async () => {
    helpers.compileString(
      `
      interface Arr {
        readonly length: number;
      }
      const foo = (value: Arr): number => value.length;
      const x = [1, 2, 3]

      assertEqual(foo(x), 3);
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinUsage },
    );
  });

  test('cannot be ambiguously referenced - variable', async () => {
    helpers.compileString(
      `
      interface Arr {
        readonly length: number;
      }
      const x: Arr = [1, 2, 3]

      assertEqual(x.length, 3);
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinUsage },
    );
  });

  test('cannot be ambiguously referenced - assignment', async () => {
    helpers.compileString(
      `
      interface Arr {
        readonly length: number;
      }
      let x: Arr | undefined;
      x = [1, 2, 3]

      assertEqual(x.length, 3);
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinUsage },
    );
  });

  test('can be unambiguously referenced - arrow return value', async () => {
    await helpers.executeString(`
      const foo = (value: Array<number>) => value;
      const x = [1, 2, 3]

      assertEqual(foo(x).length, 3);
    `);
  });

  test('can be unambiguously referenced - arrow return value explicit union type', async () => {
    await helpers.executeString(`
      interface Arr {
        readonly length: number;
      }
      const foo = (value: Array<number>): Array<number> | Arr => value;
      const x = [1, 2, 3]

      assertEqual(foo(x).length, 3);
    `);
  });

  test('cannot be ambiguously referenced - arrow return value', async () => {
    helpers.compileString(
      `
      interface Arr {
        readonly length: number;
      }
      const foo = (value: Array<number>): Arr => value;
      const x = [1, 2, 3]

      assertEqual(foo(x).length, 3);
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinUsage },
    );
  });

  test('can be unambiguously referenced - function return value', async () => {
    await helpers.executeString(
      `
      const foo = function(value: Array<number>) {
        return value;
      }
      const x = [1, 2, 3]

      assertEqual(foo(x).length, 3);
    `,
    );
  });

  test('can be unambiguously referenced - function return value explicit union type', async () => {
    await helpers.executeString(
      `
      interface Arr {
        readonly length: number;
      }
      const foo = function(value: Array<number>): Array<number> | Arr {
        return value;
      }
      const x = [1, 2, 3]

      assertEqual(foo(x).length, 3);
    `,
    );
  });

  test('cannot be ambiguously referenced - function return value', async () => {
    helpers.compileString(
      `
      interface Arr {
        readonly length: number;
      }
      const foo = function(value: Array<number>): Arr {
        return value;
      }
      const x = [1, 2, 3]

      assertEqual(foo(x).length, 3);
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinUsage },
    );
  });
});
