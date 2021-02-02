import { helpers } from '../../../../../__data__';

describe('Address', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { Address } from '@neo-one/smart-contract';
      class MyAddress implements Address {
      }
    `,
      { type: 'error' },
    );
  });
});
