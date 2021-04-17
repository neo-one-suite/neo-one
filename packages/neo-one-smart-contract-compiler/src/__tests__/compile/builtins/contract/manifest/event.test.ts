import { helpers } from '../../../../../__data__';

describe('EventDescriptor', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { ContractEventDescriptor } from '@neo-one/smart-contract';

      class MyContractEventDescriptor implements ContractEventDescriptor {
      }
    `,
      { type: 'error' },
    );
  });
});
