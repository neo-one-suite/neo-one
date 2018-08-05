import { Asset, NEOONEProvider, privateKeyToAddress } from '@neo-one/client';
import * as bootstrapTestUtils from '../__data__/bootstrapTestUtils';
import { ASSET_INFO, DEFAULT_PRIVATE_KEYS, TOKEN_INFO } from '../bootstrap';

describe('bootstrap with rpc', () => {
  test('bootstrap - rpc', async () => {
    const getCommand = async ({ rpcURL }: { rpcURL: string; network: string }) =>
      `bootstrap --rpc ${rpcURL} --testing-only --reset`;

    const getInfo = async ({ network, rpcURL }: { rpcURL: string; network: string }) => {
      const provider = new NEOONEProvider({
        options: [{ network, rpcURL }],
      }).read(network);

      const mutableAssets: { [hash: string]: Asset } = {};
      const getAsset = async (assetHash: string) => {
        if ((mutableAssets[assetHash] as Asset | undefined) === undefined) {
          mutableAssets[assetHash] = await provider.getAsset(assetHash);
        }

        return mutableAssets[assetHash];
      };

      const getWallet = async (privateKey: string, name: string) => {
        const address = privateKeyToAddress(privateKey);
        const account = await provider.getAccount(address);
        const balance = await Promise.all(
          Object.entries(account.balances).map(async ([assetHash, amount]) => {
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

      const [transferWallets, assetWallets, tokenWallets, { wallets }] = await Promise.all([
        Promise.all(DEFAULT_PRIVATE_KEYS.map(async (privateKey, idx) => getWallet(privateKey, `wallet-${idx}`))),

        Promise.all(ASSET_INFO.map(async ({ name, privateKey }) => getWallet(privateKey, `${name}-wallet`))),

        Promise.all(TOKEN_INFO.map(async ({ name, privateKey }) => getWallet(privateKey, `${name}-token-wallet`))),

        bootstrapTestUtils.getDefaultInfo({ network, rpcURL }),
      ]);

      const masterWallet = wallets.find((wallet) => wallet.name === 'master');
      if (masterWallet === undefined) {
        expect(masterWallet).toBeTruthy();
        throw new Error('For Flow');
      }

      return {
        wallets: transferWallets
          .concat(assetWallets)
          .concat(tokenWallets)
          // @ts-ignore
          .concat([masterWallet]),
      };
    };

    await bootstrapTestUtils.testBootstrap(getCommand, 10, 'priv', getInfo, '49448');
  });
});
