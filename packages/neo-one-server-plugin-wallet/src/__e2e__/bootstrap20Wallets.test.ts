import * as bootstrapTestUtils from '../__data__/bootstrapTestUtils';

describe('bootstrap 20 wallets', () => {
  test('bootstrap - 20 wallets', async () => {
    await bootstrapTestUtils.testBootstrap(
      async ({ network }) => `bootstrap --network ${network} --wallets 20 --reset`,
      20,
      'boottest-2',
      bootstrapTestUtils.getDefaultInfo,
      '49010',
    );
  });
});
