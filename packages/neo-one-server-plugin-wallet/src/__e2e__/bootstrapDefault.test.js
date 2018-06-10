/* @flow */
import * as bootstrapTestUtils from '../__data__/bootstrapTestUtils';

describe('bootstrap default', () => {
  test('bootstrap - default', async () => {
    await bootstrapTestUtils.testBootstrap(
      async ({ network }) => `bootstrap --network ${network} --reset`,
      10,
      'boottest-1',
      bootstrapTestUtils.getDefaultInfo,
    );
  });
});
