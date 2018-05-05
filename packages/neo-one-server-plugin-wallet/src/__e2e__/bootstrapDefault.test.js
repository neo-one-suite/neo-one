/* @flow */
import testBootstrap from './bootstrapTestUtils';

describe('bootstrap default', () => {
  test('bootstrap - default', async () => {
    const numWallets = 10;
    const network = 'boottest-1';
    const command = `bootstrap --network ${network}`;

    await testBootstrap(command, numWallets, network);
  });
});
