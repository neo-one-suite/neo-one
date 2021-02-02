import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Object.keys', () => {
  test('should return enumerable own instance properties', async () => {
    await helpers.executeString(`
      class Foo {
        public readonly x = 'x';

        public get y(): string {
          return 'y';
        }

        public get z(): string {
          return 'z';
        }

        public set z(value: string) {
          // do nothing
        }
      }

      class Bar extends Foo {
        protected readonly a = 'a';
      }

      const bar = new Bar();
      Object.keys(bar);
      const keys = Object.keys(bar);

      assertEqual(keys.length, 2);
      assertEqual(keys[0], 'x');
      assertEqual(keys[1], 'a');
    `);
  });

  test('should return enumerable own object properties', async () => {
    await helpers.executeString(`
      const foo = {
        x: 'x',
        get y(): string {
          return 'y';
        },
        get z(): string {
          return 'z';
        },
        set z(value: string) {
          // do nothing
        },
        a(): string {
          return 'a';
        },
      };

      const keys = Object.keys(foo);

      assertEqual(keys.length, 4);
      assertEqual(keys[0], 'x');
      assertEqual(keys[1], 'y');
      assertEqual(keys[2], 'z');
      assertEqual(keys[3], 'a');
    `);
  });

  test('should return enumerable own object properties on arrays', async () => {
    await helpers.executeString(`
      const foo = [3, 4, 5];

      const keys = Object.keys(foo);

      assertEqual(keys.length, 3);
      assertEqual(keys[0], '0');
      assertEqual(keys[1], '1');
      assertEqual(keys[2], '2');
    `);
  });

  test('should return an empty array for non-objects', async () => {
    await helpers.executeString(`
      const foo = 3;

      const keys = Object.keys(foo);

      assertEqual(keys.length, 0);
    `);
  });

  test('should throw a type error for undefined', async () => {
    await helpers.compileString(
      `
      const foo: number | undefined = undefined as number | undefined;
      let error: string | undefined;
      let keys: Array<string> | undefined;
      try {
        keys = Object.keys(foo);
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'TypeError');
      assertEqual(keys, undefined);
    `,
      { type: 'error' },
    );
  });

  test('cannot be property referenced', async () => {
    await helpers.compileString(
      `
      const keys = Object.keys;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be property referenced - object literal', async () => {
    await helpers.compileString(
      `
      const { keys } = Object;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be element referenced', async () => {
    await helpers.compileString(
      `
      const keys = Object['keys'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
