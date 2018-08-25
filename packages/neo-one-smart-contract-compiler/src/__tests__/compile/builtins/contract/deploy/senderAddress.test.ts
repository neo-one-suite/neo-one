import { helpers } from '../../../../../__data__';
import { DiagnosticCode } from '../../../../../DiagnosticCode';

describe('Deploy.senderAddress', () => {
  test('cannot be used in a function', async () => {
    helpers.compileString(
      `
      import { Deploy } from '@neo-one/smart-contract';

      function foo(value: number = Deploy.senderAddress) {
        return value;
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidSenderAddress },
    );
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      import { Deploy } from '@neo-one/smart-contract';

      const x = Deploy.senderAddress;
    `,
      { type: 'error', code: DiagnosticCode.InvalidSenderAddress },
    );
  });
});
