import { helpers } from '../../../../../__data__';
import { DiagnosticCode } from '../../../../../DiagnosticCode';

describe('SmartContract', () => {
  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';
      const x = SmartContract;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
