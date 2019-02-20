import { Account, AddressString, NetworkType, publicKeyToAddress } from '@neo-one/client-common';
import { Monitor } from '@neo-one/monitor';
import _ from 'lodash';
import { InvalidMasterPathError } from '../../errors';
import { HDAccount, HDHandler, HDStore } from './HDKeyStore';

export type LocalPath = [number, number, number];
export type LocalHDAccount = HDAccount<LocalPath>;

export interface HDLocalStore extends HDStore<LocalPath> {
  readonly getMasterPath: () => Promise<ReadonlyArray<number>>;
}

export class LocalHDHandler implements HDHandler<[number, number, number]> {
  private readonly store: HDLocalStore;
  private readonly getAccount: (network: NetworkType, address: AddressString, monitor?: Monitor) => Promise<Account>;

  public constructor(
    getAccount: (network: NetworkType, address: AddressString, monitor?: Monitor) => Promise<Account>,
    store: HDLocalStore,
  ) {
    this.getAccount = getAccount;
    this.store = store;
  }

  public async scanAccounts(network: NetworkType): Promise<ReadonlyArray<LocalHDAccount>> {
    const masterPath = await this.store.getMasterPath();
    switch (masterPath.length) {
      case 0:
        return this.scanTree(network, 5);
      case 1:
        return this.scanWallet(network, masterPath[0]);
      case 2:
        return this.scanChain(network, masterPath as [number, number], 10);
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

  private async scanTree(network: NetworkType, maxOffset: number): Promise<ReadonlyArray<LocalHDAccount>> {
    const scanTreeInternal = async (start: number, currentOffset = 0): Promise<ReadonlyArray<LocalHDAccount>> => {
      const uncheckedAccounts = await Promise.all(
        _.range(start, start + maxOffset).map(async (index) => this.scanWallet(network, index)),
      );

      const { accounts: newAccounts, offset: newOffset } = uncheckedAccounts.reduce<{
        readonly accounts: ReadonlyArray<LocalHDAccount>;
        readonly offset: number;
      }>(
        (acc, unchecked) => ({
          accounts: acc.accounts.concat(unchecked),
          offset: unchecked.length === 2 ? acc.offset + 1 : 1,
        }),
        {
          accounts: [],
          offset: currentOffset,
        },
      );

      if (newOffset < maxOffset) {
        const nextAccounts = await scanTreeInternal(start + maxOffset, newOffset);

        return newAccounts.concat(nextAccounts);
      }

      return newAccounts.slice(newOffset - maxOffset, maxOffset);
    };

    const wallets = await scanTreeInternal(0);

    return wallets.slice(0, wallets.length - (maxOffset - 2));
  }

  private async scanWallet(network: NetworkType, walletIndex: number): Promise<ReadonlyArray<LocalHDAccount>> {
    const externalPath: [number, number] = [walletIndex, 0];
    const internalPath: [number, number] = [walletIndex, 1];

    const scannedChains = await Promise.all([
      this.scanChain(network, externalPath, 10),
      this.scanChain(network, internalPath, 10),
    ]);

    return _.flatten(scannedChains);
  }

  private async scanChain(
    network: NetworkType,
    chainIndex: [number, number],
    maxOffset: number,
  ): Promise<ReadonlyArray<LocalHDAccount>> {
    const scanChainInternal = async (start: number, currentOffset = 0): Promise<ReadonlyArray<LocalHDAccount>> => {
      const localHDAccounts = await Promise.all(
        _.range(start, start + maxOffset).map(async (num) => {
          const path: LocalPath = [chainIndex[0], chainIndex[1], num];
          const key = await this.store.getPublicKey(path);

          return this.publicKeyToLocalHDAccount(path, key, network);
        }),
      );

      const unscannedAccounts = await Promise.all(
        localHDAccounts.map(async (account) => {
          const { balances } = await this.getAccount(network, account.userAccount.publicKey);

          return {
            empty: Object.values(balances).every((balance) => balance.isEqualTo(0)),
            account,
          };
        }),
      );

      const { accounts: newAccounts, offset: newOffset } = unscannedAccounts.reduce<{
        readonly accounts: ReadonlyArray<LocalHDAccount>;
        readonly offset: number;
      }>(
        (acc, unscanned) => ({
          accounts: acc.accounts.concat(unscanned.account),
          offset: unscanned.empty ? acc.offset + 1 : 0,
        }),
        {
          accounts: [],
          offset: currentOffset,
        },
      );

      if (newOffset < maxOffset) {
        const nextAccounts = await scanChainInternal(start + maxOffset, newOffset);

        return newAccounts.concat(nextAccounts);
      }

      return newAccounts.slice(newOffset - maxOffset, maxOffset);
    };

    const accounts = await scanChainInternal(0);

    return accounts.slice(0, accounts.length - (maxOffset - 1));
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
