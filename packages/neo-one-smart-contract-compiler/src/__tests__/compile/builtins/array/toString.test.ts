import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array.prototype.toString', () => {
  test('should convert the array to a string', async () => {
    await helpers.executeString(`
      const x: ReadonlyArray<number> = [1, 2, 3];

      x.toString();
      assertEqual(\`\${x}\`, x.toString());
    `);
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      const x: ReadonlyArray<number> = [0, 1, 2];
      const y = x.toString;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
