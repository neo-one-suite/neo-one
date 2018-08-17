import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Attribute', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      import { AttributeBase } from '@neo-one/smart-contract';

      class MyAttribute implements AttributeBase {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      import { AttributeBase } from '@neo-one/smart-contract';

      const x = AttributeBase;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
