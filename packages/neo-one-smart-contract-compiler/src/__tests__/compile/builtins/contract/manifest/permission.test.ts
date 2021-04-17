import { helpers } from '../../../../../__data__';

describe('Permission', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { ContractPermission } from '@neo-one/smart-contract';

      class MyContractPermission implements ContractPermission {
      }
    `,
      { type: 'error' },
    );
  });
});
