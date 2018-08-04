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

  test('cannot be property referenced', async () => {
    await helpers.compileString(
      `
      const keys = Object.keys;
    `,
      { type: 'error', code: DiagnosticCode.CANNOT_REFERENCE_BUILTIN_PROPERTY },
    );
  });

  test.skip('cannot be element referenced', async () => {
    await helpers.compileString(
      `
      const keys = Object['keys'];
    `,
      { type: 'error', code: DiagnosticCode.CANNOT_REFERENCE_BUILTIN_PROPERTY },
    );
  });
});
