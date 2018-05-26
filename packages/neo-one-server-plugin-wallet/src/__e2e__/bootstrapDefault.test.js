/* @flow */
import testBootstrap from '../__data__/bootstrapTestUtils';

describe('bootstrap default', () => {
  test('bootstrap - default', async () => {
    const numWallets = 10;
    const network = 'boottest-1';
    const command = `bootstrap --network ${network}`;

    await testBootstrap(command, numWallets, network);
  });
});
