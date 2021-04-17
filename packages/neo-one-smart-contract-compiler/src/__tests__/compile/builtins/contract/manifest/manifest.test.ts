import { helpers } from '../../../../../__data__';

describe('Manifest', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { ContractManifest } from '@neo-one/smart-contract';

      class MyContractManifest implements ContractManifest {
      }
    `,
      { type: 'error' },
    );
  });
});
