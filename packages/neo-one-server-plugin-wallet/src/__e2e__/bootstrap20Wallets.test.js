/* @flow */
import testBootstrap from './bootstrapTestUtils';

describe('bootstrap 20 wallets', () => {
  test('bootstrap - 20 wallets', async () => {
    const numWallets = 20;
    const network = 'boottest-2';
    const command = `bootstrap --network ${network} --wallets 20`;

    await testBootstrap(command, numWallets, network);
  });
});
