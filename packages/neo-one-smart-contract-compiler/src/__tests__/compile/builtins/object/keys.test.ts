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

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const keys = Object.keys;
    `,
      { type: 'error', code: DiagnosticCode.CANNOT_REFERENCE_BUILTIN_PROPERTY },
    );
  });
});
