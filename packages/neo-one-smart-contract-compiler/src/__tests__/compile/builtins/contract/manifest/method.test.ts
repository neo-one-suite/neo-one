import { helpers } from '../../../../../__data__';

describe('MethodDescriptor', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { ContractMethodDescriptor } from '@neo-one/smart-contract';

      class MyContractMethodDescriptor implements ContractMethodDescriptor {
      }
    `,
      { type: 'error' },
    );
  });
});
