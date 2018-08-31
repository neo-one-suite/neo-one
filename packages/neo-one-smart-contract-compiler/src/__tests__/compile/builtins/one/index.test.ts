import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('one', () => {
  test('cannot be referenced - one0', async () => {
    helpers.compileString(
      `
      const x = one0;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be referenced - one1', async () => {
    helpers.compileString(
      `
      const x = one1;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be referenced in property - one0', async () => {
    helpers.compileString(
      `
      const x = { [one0]: 'hello' };
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be referenced in property - one1', async () => {
    helpers.compileString(
      `
      const x = { [one1]: 'hello' };
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be referenced in property access - one0', async () => {
    helpers.compileString(
      `
      const error = new Error();
      const x = error[one0];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be referenced in property access - one1', async () => {
    helpers.compileString(
      `
      const error = new Error();
      const x = error[one1];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
