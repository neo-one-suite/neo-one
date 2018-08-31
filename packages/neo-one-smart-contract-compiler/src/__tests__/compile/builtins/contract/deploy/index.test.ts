import { helpers } from '../../../../../__data__';

describe('Deploy', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      import { DeployConstructor } from '@neo-one/smart-contract';

      class MyDeploy implements DeployConstructor {
      }
    `,
      { type: 'error' },
    );
  });
});
