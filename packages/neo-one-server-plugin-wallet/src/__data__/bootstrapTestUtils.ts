import { addressToScriptHash, NEOONEProvider, privateKeyToAddress, ReadClient } from '@neo-one/client';
import { common } from '@neo-one/client-core';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { ASSET_INFO, compileSmartContract, TOKEN_INFO, TokenInfo } from '../bootstrap';
import { constants } from '../constants';

export async function getNetworkInfo(
  network: string,
): Promise<{
  readonly height: number;
  readonly rpcURL: string;
}> {
  const networkOutput = await one.execute(`describe network ${network} --json`);
  const networkInfo = one.parseJSON(networkOutput);

  return {
    height: parseInt(networkInfo[3][1].table[1][6], 10),
    rpcURL: networkInfo[3][1].table[1][3],
  };
}

interface Coin {
  readonly asset: string;
  readonly name: string;
  readonly amount: string;
}

interface Wallet {
  readonly name: string;
  readonly address: string;
  readonly balance: ReadonlyArray<Coin>;
}

const ASSET_WALLET_ADDRESSES = new Set(ASSET_INFO.map(({ privateKey }) => privateKeyToAddress(privateKey)));

const TOKEN_WALLET_ADDRESSES = new Set(TOKEN_INFO.map(({ privateKey }) => privateKeyToAddress(privateKey)));

const TOKEN_HASHES: { readonly [tokenName: string]: string } = {
  RedToken: '0x6937b11039ba775836c32682738bac4e4922d671',
  BlueToken: '0xeeb5765790d7a43dbf7026cf8c1164bb9188055b',
  GreenToken: '0xa204296a3841bc03da6c700c22603bbbda01bee7',
};

function expectNotNull<T>(value: T | null | undefined): T {
  if (value == undefined) {
    expect(value).toBeTruthy();
    throw new Error('For Flow');
  }

  return value;
}

const getCoin = (wallet: Wallet, test: (coin: Coin) => boolean) => expectNotNull(wallet.balance.find(test));

const getAssetCoin = (wallet: Wallet, asset: string) => getCoin(wallet, (coin) => coin.asset === asset);
const getAssetNameCoin = (wallet: Wallet, name: string) => getCoin(wallet, (coin) => coin.name === name);

const getSmartContract = async ({ token, client }: { readonly token: TokenInfo; readonly client: ReadClient }) => {
  const { abi } = await compileSmartContract(token.name);

  return client.smartContract(TOKEN_HASHES[token.name], abi);
};

const getSmartContracts = async ({ client }: { readonly client: ReadClient }) =>
  Promise.all(
    TOKEN_INFO.map(async (token) => {
      const smartContract = await getSmartContract({ token, client });

      return { token, smartContract };
    }),
  );

const testTransfersAndClaims = ({ transferWallets }: { readonly transferWallets: ReadonlyArray<Wallet> }) => {
  const [firstWallets, secondWallets] = _.chunk(transferWallets, transferWallets.length / 2);

  firstWallets.forEach((wallet) => {
    const neoCoin = getAssetCoin(wallet, common.NEO_ASSET_HASH);
    expect(neoCoin.amount).toEqual('750000');

    const gasCoin = getAssetCoin(wallet, common.GAS_ASSET_HASH);
    // Additional .08 for the gas claim
    expect(gasCoin.amount).toEqual('750000.08');
  });

  secondWallets.forEach((wallet) => {
    const neoCoin = getAssetCoin(wallet, common.NEO_ASSET_HASH);
    expect(neoCoin.amount).toEqual('250000');

    const gasCoin = getAssetCoin(wallet, common.GAS_ASSET_HASH);
    expect(gasCoin.amount).toEqual('250000');
  });
};

const getAddressToWallet = (wallets: ReadonlyArray<Wallet>): { readonly [address: string]: Wallet } => {
  const addressToWallet: { [address: string]: Wallet } = {};
  wallets.forEach((wallet) => {
    // tslint:disable-next-line no-object-mutation
    addressToWallet[wallet.address] = wallet;
  });

  return addressToWallet;
};

const testAssets = ({
  wallets,
  transferWallets,
}: {
  readonly wallets: ReadonlyArray<Wallet>;
  readonly transferWallets: ReadonlyArray<Wallet>;
}) => {
  const addressToWallet = getAddressToWallet(wallets);
  // Order is important here due to the idx % 2 check below
  const assetWallets = ASSET_INFO.map((asset) => {
    const wallet = addressToWallet[privateKeyToAddress(asset.privateKey)];
    // tslint:disable-next-line strict-type-predicates
    if (wallet === undefined) {
      return undefined;
    }

    return { asset, wallet };
  }).filter(utils.notNull);
  expect(assetWallets.length).toEqual(ASSET_INFO.length);

  assetWallets.forEach(({ asset, wallet }, idx) => {
    const assetCoin = getAssetNameCoin(wallet, asset.name);
    const transferredWallets =
      idx % 2 === 0
        ? transferWallets.slice(0, transferWallets.length / 2)
        : transferWallets.slice(transferWallets.length / 2);
    expect(assetCoin.amount).toEqual(
      asset.amount
        .minus(
          asset.amount
            .div(2)
            .div(transferredWallets.length)
            .integerValue(BigNumber.ROUND_FLOOR)
            .times(transferredWallets.length),
        )
        .toString(),
    );

    const gasCoin = getCoin(wallet, (coin) => coin.asset === common.GAS_ASSET_HASH);

    expect(gasCoin.amount).toEqual('44510');

    transferredWallets.forEach((transferredWallet) => {
      const transferredAssetCoin = getAssetNameCoin(transferredWallet, asset.name);

      expect(transferredAssetCoin.amount).toEqual(
        asset.amount
          .div(2)
          .div(transferredWallets.length)
          .integerValue(BigNumber.ROUND_FLOOR)
          .toString(),
      );
    });
  });
};

const testTokens = async ({
  wallets,
  transferWallets,
  client,
  tokenGas,
}: {
  readonly wallets: ReadonlyArray<Wallet>;
  readonly transferWallets: ReadonlyArray<Wallet>;
  readonly client: ReadClient;
  readonly tokenGas: string;
}) => {
  const addressToWallet = getAddressToWallet(wallets);
  // Order is important here due to the idx % 2 check below
  const tokenWallets = TOKEN_INFO.map((token) => addressToWallet[privateKeyToAddress(token.privateKey)]).filter(
    Boolean,
  );
  expect(tokenWallets.length).toEqual(TOKEN_INFO.length);

  const tokenAndSmartContracts = await getSmartContracts({ client });

  await Promise.all(
    utils.zip(tokenAndSmartContracts, tokenWallets).map(async ([{ token, smartContract }, wallet], idx) => {
      const balance = await smartContract.balanceOf(addressToScriptHash(wallet.address));

      const transferredWallets =
        idx % 2 === 0
          ? transferWallets.slice(0, transferWallets.length / 2)
          : transferWallets.slice(transferWallets.length / 2);
      expect(balance.toString()).toEqual(
        token.amount
          .minus(
            token.amount
              .div(2)
              .div(transferredWallets.length)
              .integerValue(BigNumber.ROUND_FLOOR)
              .times(transferredWallets.length),
          )
          .toString(),
      );

      const gasCoin = getCoin(wallet, (coin) => coin.asset === common.GAS_ASSET_HASH);

      expect(gasCoin.amount).toEqual(tokenGas);

      await Promise.all(
        transferredWallets.map(async (transferredWallet) => {
          const transferredBalance = await smartContract.balanceOf(addressToScriptHash(transferredWallet.address));

          expect(transferredBalance.toString()).toEqual(
            token.amount
              .div(2)
              .div(transferredWallets.length)
              .integerValue(BigNumber.ROUND_FLOOR)
              .toString(),
          );
        }),
      );
    }),
  );
};

export interface Info {
  readonly wallets: ReadonlyArray<Wallet>;
}

interface Options {
  readonly network: string;
  readonly rpcURL: string;
}

export async function getDefaultInfo({ network }: Options): Promise<Info> {
  const outputs = await one.execute(`get wallet --network ${network} --json`);
  const walletNames = one
    .parseJSON(outputs)
    .slice(1)
    // tslint:disable-next-line no-any
    .map((info: any) => info[1]);
  const wallets = await Promise.all(
    walletNames.map(async (walletName: string) => {
      const output = await one.execute(`describe wallet ${walletName} --network ${network} --json`);

      const wallet = one.parseJSON(output);

      return {
        name: walletName,
        // tslint:disable-next-line no-any
        address: expectNotNull(wallet.find((value: any) => value[0] === 'Address'))[1],
        // tslint:disable-next-line no-any
        balance: expectNotNull(wallet.find((value: any) => value[0] === 'Balance'))[1]
          .table.slice(1)
          .map(([name, amount, asset]: [string, string, string]) => ({
            name,
            amount,
            asset,
          })),
      };
    }),
  );

  // @ts-ignore
  return { wallets };
}

export async function testBootstrap(
  getCommand: (options: Options) => Promise<string>,
  numWallets: number,
  network: string,
  getInfo: (options: Options) => Promise<Info>,
  tokenGas: string,
): Promise<void> {
  await one.execute(`create network ${network}`);

  const { rpcURL } = await getNetworkInfo(network);
  const command = await getCommand({ network, rpcURL });

  await one.execute(command);

  const [{ height }, { wallets }] = await Promise.all([getNetworkInfo(network), getInfo({ network, rpcURL })]);

  // numWallets / 2 token transfers
  // tslint:disable-next-line binary-expression-operand-order
  expect(height).toEqual(12 + numWallets / 2);

  // Bootstrap creates numWallets number of wallets
  // Wallets will also have the master wallet plus
  // asset wallets plus token wallets
  expect(wallets.length).toEqual(numWallets + 1 + ASSET_INFO.length + TOKEN_INFO.length);

  const transferWallets = _.sortBy(
    wallets.filter(
      (wallet) =>
        !ASSET_WALLET_ADDRESSES.has(wallet.address) &&
        !TOKEN_WALLET_ADDRESSES.has(wallet.address) &&
        wallet.name !== constants.MASTER_WALLET,
    ),

    (wallet) => parseInt(wallet.name.slice('wallet-'.length), 10),
  );

  expect(transferWallets.length).toEqual(numWallets);

  const provider = new NEOONEProvider({
    options: [{ network, rpcURL }],
  }).read(network);
  const client = new ReadClient(provider);

  testTransfersAndClaims({ transferWallets });
  testAssets({ wallets, transferWallets });
  await testTokens({ wallets, transferWallets, client, tokenGas });
}
