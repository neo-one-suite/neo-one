import { helpers } from '../../../../../__data__';

describe('ParameterDefinition', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { ContractParameterDefinition } from '@neo-one/smart-contract';

      class MyContractParameterDefinition implements ContractParameterDefinition {
      }
    `,
      { type: 'error' },
    );
  });
});
