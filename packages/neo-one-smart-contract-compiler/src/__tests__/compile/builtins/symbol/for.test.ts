import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Symbol.for', () => {
  test('should create symbols', async () => {
    await helpers.executeString(`
      Symbol.for('hello');
      const x = Symbol.for('world');

      assertEqual(x, x);
    `);
  });

  test('should create equivalent symbols', async () => {
    await helpers.executeString(`
      const x: symbol = Symbol.for('hello');
      const y: symbol = Symbol.for('hello');

      assertEqual(x, y);
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const value = Symbol.for;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
