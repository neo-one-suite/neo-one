import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array.prototype.join', () => {
  test('should convert the array to a string', async () => {
    await helpers.executeString(`
      const x: ReadonlyArray<number> = [1, 2, 3];

      x.join();
      assertEqual(\`\${x}\`, x.join());
    `);
  });

  test('should convert the array to a string using a custom separator', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];

      assertEqual('1|2|3', x.join('|'));
    `);
  });

  test('should convert the array as possible object to a string using a custom separator', async () => {
    await helpers.executeString(`
      interface Arr<T> {
        join(separator?: string): string;
      }
      const x: ReadonlyArray<number> | Arr<number> = [1, 2, 3] as ReadonlyArray<number> | Arr<number>;

      assertEqual('1|2|3', x['join']('|'));
    `);
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      const x: ReadonlyArray<number> = [0, 1, 2];
      const y = x.join;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
