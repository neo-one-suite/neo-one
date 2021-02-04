import { helpers } from '../../../../../__data__';

describe('PublicKey', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { PublicKey } from '@neo-one/smart-contract';
      class MyPublicKey implements PublicKey {
      }
    `,
      { type: 'error' },
    );
  });
});
