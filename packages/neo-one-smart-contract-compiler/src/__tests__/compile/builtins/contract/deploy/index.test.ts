import { helpers } from '../../../../../__data__';
import { DiagnosticCode } from '../../../../../DiagnosticCode';

describe('Deploy', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      import { DeployConstructor } from '@neo-one/smart-contract';

      class MyDeploy implements DeployConstructor {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      import { Deploy } from '@neo-one/smart-contract';

      const x = Deploy;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
