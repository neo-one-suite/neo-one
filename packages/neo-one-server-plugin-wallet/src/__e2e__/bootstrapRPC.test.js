/* @flow */
import { NEOONEProvider, privateKeyToAddress } from '@neo-one/client';
import { utils } from '@neo-one/utils';

import { ASSET_INFO, TOKEN_INFO, DEFAULT_PRIVATE_KEYS } from '../bootstrap';

import * as bootstrapTestUtils from '../__data__/bootstrapTestUtils';

describe('bootstrap with rpc', () => {
  test('bootstrap - rpc', async () => {
    const getCommand = async ({
      rpcURL,
    }: {|
      rpcURL: string,
      network: string,
    |}) => `bootstrap --rpc ${rpcURL} --testing-only --reset`;

    const getInfo = async ({
      network,
      rpcURL,
    }: {|
      rpcURL: string,
      network: string,
    |}) => {
      const provider = new NEOONEProvider({
        options: [{ network, rpcURL }],
      }).read(network);

      const assets = {};
      const getAsset = (assetHash: string) => {
        if (assets[assetHash] == null) {
          assets[assetHash] = provider.getAsset(assetHash);
        }

        return assets[assetHash];
      };

      const getWallet = async (privateKey: string, name: string) => {
        const address = privateKeyToAddress(privateKey);
        const account = await provider.getAccount(address);
        const balance = await Promise.all(
          utils.entries(account.balances).map(async ([assetHash, amount]) => {
            const asset = await getAsset(assetHash);
            return {
              asset: assetHash,
              name: asset.name,
              amount: amount.toString(),
            };
          }),
        );

        return {
          name,
          address,
          balance,
        };
      };

      const [
        transferWallets,
        assetWallets,
        tokenWallets,
        { wallets },
      ] = await Promise.all([
        Promise.all(
          DEFAULT_PRIVATE_KEYS.map((privateKey, idx) =>
            getWallet(privateKey, `wallet-${idx}`),
          ),
        ),
        Promise.all(
          ASSET_INFO.map(({ name, privateKey }) =>
            getWallet(privateKey, `${name}-wallet`),
          ),
        ),
        Promise.all(
          TOKEN_INFO.map(({ name, privateKey }) =>
            getWallet(privateKey, `${name}-token-wallet`),
          ),
        ),
        bootstrapTestUtils.getDefaultInfo({ network, rpcURL }),
      ]);
      const masterWallet = wallets.find((wallet) => wallet.name === 'master');
      if (masterWallet == null) {
        expect(masterWallet).toBeTruthy();
        throw new Error('For Flow');
      }

      return {
        wallets: transferWallets
          .concat(assetWallets)
          .concat(tokenWallets)
          .concat([masterWallet]),
      };
    };

    await bootstrapTestUtils.testBootstrap(
      getCommand,
      10,
      'boottest-rpc',
      getInfo,
    );
  });
});
