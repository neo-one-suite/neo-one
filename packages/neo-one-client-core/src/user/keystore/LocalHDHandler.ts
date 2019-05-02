import { Account, AddressString, NetworkType, publicKeyToAddress } from '@neo-one/client-common';
import { Monitor } from '@neo-one/monitor';
import _ from 'lodash';
import { InvalidMasterPathError } from '../../errors';
import { HDAccount, HDHandler } from './HDKeyStore';
import { HDStore } from './types';

export type LocalPath = readonly [number, number, number];
export type LocalHDAccount = HDAccount<LocalPath>;

export interface HDLocalStore extends HDStore<LocalPath> {
  readonly getMasterPath: () => Promise<readonly number[]>;
}

interface ScanInterface {
  readonly empty: boolean;
  readonly accounts: readonly LocalHDAccount[];
}

export class LocalHDHandler implements HDHandler<readonly [number, number, number]> {
  private readonly store: HDLocalStore;
  private readonly getAccount: (network: NetworkType, address: AddressString, monitor?: Monitor) => Promise<Account>;

  public constructor(
    getAccount: (network: NetworkType, address: AddressString, monitor?: Monitor) => Promise<Account>,
    store: HDLocalStore,
  ) {
    this.getAccount = getAccount;
    this.store = store;
  }

  public async scanAccounts(network: NetworkType, maxOffset = 5): Promise<readonly LocalHDAccount[]> {
    const masterPath = await this.store.getMasterPath();
    switch (masterPath.length) {
      case 0:
        return this.scanTree(network, maxOffset);
      case 1:
        const wallet = await this.scanWallet(network, masterPath[0], maxOffset);

        return _.flatten(wallet.accounts);
      case 2:
        const chain = await this.scanChain(network, masterPath as [number, number], maxOffset);

        return _.flatten(chain.accounts);
      default:
        throw new InvalidMasterPathError(masterPath);
    }
  }

  public async sign(options: { readonly message: Buffer; readonly account: LocalPath }): Promise<Buffer> {
    return this.store.sign(options);
  }

  public async close(): Promise<void> {
    await this.store.close();
  }

  private async scanTree(network: NetworkType, maxOffset: number): Promise<readonly LocalHDAccount[]> {
    const scanTreeInternal = async (
      start: number,
      currentOffset = 0,
    ): Promise<readonly (readonly LocalHDAccount[])[]> => {
      const uncheckedWallets = await Promise.all(
        _.range(start, start + maxOffset - currentOffset).map(async (index) => this.scanWallet(network, index)),
      );

      const { wallets: newWallets, offset: newOffset } = uncheckedWallets.reduce<{
        readonly wallets: readonly (readonly LocalHDAccount[])[];
        readonly offset: number;
      }>(
        (acc, unchecked) => ({
          wallets: acc.wallets.concat([unchecked.accounts]),
          offset: unchecked.empty ? acc.offset + 1 : 1,
        }),
        {
          wallets: [],
          offset: currentOffset,
        },
      );

      if (newOffset < maxOffset) {
        const nextAccounts = await scanTreeInternal(start + maxOffset - currentOffset, newOffset);

        return newWallets.concat(nextAccounts);
      }

      return newWallets;
    };

    const wallets = await scanTreeInternal(0);

    return _.flatten(wallets.slice(0, wallets.length - (maxOffset - 2)));
  }

  private async scanWallet(network: NetworkType, walletIndex: number, maxOffset?: number): Promise<ScanInterface> {
    const externalPath: [number, number] = [walletIndex, 0];
    const internalPath: [number, number] = [walletIndex, 1];

    const scannedChains = await Promise.all([
      this.scanChain(network, externalPath, maxOffset),
      this.scanChain(network, internalPath, maxOffset),
    ]);

    return {
      empty: scannedChains.every((chain) => chain.empty),
      accounts: _.flatten(scannedChains.map(({ accounts }) => accounts)),
    };
  }

  private async scanChain(
    network: NetworkType,
    chainIndex: readonly [number, number],
    maxOffset = 5,
  ): Promise<ScanInterface> {
    const scanChainInternal = async (start: number, currentOffset = 0): Promise<readonly LocalHDAccount[]> => {
      const localHDAccounts = await Promise.all(
        _.range(start, start + maxOffset - currentOffset).map(async (num) => {
          const path: LocalPath = [chainIndex[0], chainIndex[1], num];
          const key = await this.store.getPublicKey(path);

          return this.publicKeyToLocalHDAccount(path, key, network);
        }),
      );

      const unscannedAccounts = await Promise.all(
        localHDAccounts.map(async (account) => {
          const { balances } = await this.getAccount(network, account.userAccount.id.address);

          return {
            empty: Object.values(balances).every((balance) => balance.isEqualTo(0)),
            account,
          };
        }),
      );

      const { accounts: newAccounts, offset: newOffset } = unscannedAccounts.reduce<{
        readonly accounts: readonly LocalHDAccount[];
        readonly offset: number;
      }>(
        (acc, unscanned) => ({
          accounts: acc.accounts.concat(unscanned.account),
          offset: unscanned.empty ? acc.offset + 1 : 1,
        }),
        {
          accounts: [],
          offset: currentOffset,
        },
      );

      if (newOffset < maxOffset) {
        const nextAccounts = await scanChainInternal(start + maxOffset - currentOffset, newOffset);

        return newAccounts.concat(nextAccounts);
      }

      return newAccounts;
    };

    const accounts = await scanChainInternal(0);

    const accountsTrimmed = accounts.slice(0, accounts.length - (maxOffset - 2));

    return {
      empty: accountsTrimmed.length === 2,
      accounts: accountsTrimmed,
    };
  }

  private publicKeyToLocalHDAccount(path: LocalPath, publicKey: string, network: NetworkType): LocalHDAccount {
    return {
      identifier: path,
      userAccount: {
        id: {
          network,
          address: publicKeyToAddress(publicKey),
        },
        name: path.toString(),
        publicKey,
      },
    };
  }
}
