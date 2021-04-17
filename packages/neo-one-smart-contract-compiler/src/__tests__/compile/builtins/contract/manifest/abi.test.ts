import { helpers } from '../../../../../__data__';

describe('ABI', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { ContractABI } from '@neo-one/smart-contract';

      class MyContractABI implements ContractABI {
      }
    `,
      { type: 'error' },
    );
  });
});
