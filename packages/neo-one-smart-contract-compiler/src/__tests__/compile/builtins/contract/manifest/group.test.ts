import { helpers } from '../../../../../__data__';

describe('Group', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { ContractGroup } from '@neo-one/smart-contract';

      class MyContractGroup implements ContractGroup {
      }
    `,
      { type: 'error' },
    );
  });
});
