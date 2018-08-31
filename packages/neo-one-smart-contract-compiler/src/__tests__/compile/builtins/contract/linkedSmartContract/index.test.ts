import { helpers } from '../../../../../__data__';

describe('LinkedSmartContract', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      import { LinkedSmartContract } from '@neo-one/smart-contract';
      class MyLinkedSmartContract implements LinkedSmartContract {
      }
    `,
      { type: 'error' },
    );
  });
});
