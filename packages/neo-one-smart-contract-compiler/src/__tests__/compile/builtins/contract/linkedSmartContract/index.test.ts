import { helpers } from '../../../../../__data__';
import { DiagnosticCode } from '../../../../../DiagnosticCode';

describe('LinkedSmartContract', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      import { LinkedSmartContract } from '@neo-one/smart-contract';
      class MyLinkedSmartContract implements LinkedSmartContract {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      import { LinkedSmartContract } from '@neo-one/smart-contract';
      const x = LinkedSmartContract;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
