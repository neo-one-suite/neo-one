import { AccountContract, UserAccountJSON } from '@neo-one/client-common';
import { PasswordRequiredError } from '../../errors';
import { LocalStore, LocalWallet, LockedWallet, UnlockedWallet } from './LocalKeyStore';

/**
 * Interface that `LocalStringStore` requires to function.
 */
export interface LocalStringStoreStorage {
  /**
   * Set `key` to `value`.
   */
  readonly setItem: (key: string, value: string) => Promise<void>;
  /**
   * Return the value of `key`
   */
  readonly getItem: (key: string) => Promise<string>;
  /**
   * Remove `key`.
   */
  readonly removeItem: (key: string) => Promise<void>;
  /**
   * Return all keys.
   */
  readonly getAllKeys: () => Promise<readonly string[]>;
}

export interface LockedWalletJSON extends Omit<LockedWallet, 'userAccount'> {
  readonly userAccount: UserAccountJSON;
}

export interface UnlockedWalletJSON extends Omit<UnlockedWallet, 'userAccount'> {
  readonly userAccount: UserAccountJSON;
}

export type LocalWalletJSON = LockedWalletJSON | UnlockedWalletJSON;

const toWalletJSON = (wallet: LocalWallet): LocalWalletJSON => {
  const { contract, ...rest } = wallet.userAccount;
  const userAccountJSON = {
    ...rest,
    contract: contract.serializeJSON(),
  };
  if (wallet.userAccount.id.network === 'main') {
    if (wallet.nep2 === undefined) {
      throw new PasswordRequiredError();
    }

    return {
      type: 'locked',
      userAccount: userAccountJSON,
      nep2: wallet.nep2,
    };
  }

  const { userAccount: _userAccount, ...walletRest } = wallet;

  return {
    ...walletRest,
    userAccount: userAccountJSON,
  };
};

const fromWalletJSON = (wallet: LocalWalletJSON): LocalWallet => {
  const {
    userAccount: { contract, ...accountRest },
    ...rest
  } = wallet;
  const deserializedContract = AccountContract.fromJSON(contract);

  const userAccount = {
    ...accountRest,
    contract: deserializedContract,
  };

  return {
    ...rest,
    userAccount,
  };
};

/**
 * Implements the `LocalStore` interface expected by `LocalKeyStore`.
 */
export class LocalStringStore implements LocalStore {
  public constructor(public readonly storage: LocalStringStoreStorage) {}

  public async getWallets(): Promise<readonly LocalWallet[]> {
    const keys = await this.storage.getAllKeys();
    const values = await Promise.all(keys.map(async (key) => this.storage.getItem(key)));

    return values.map((value) => fromWalletJSON(JSON.parse(value)));
  }

  public async saveWallet(wallet: LocalWallet): Promise<void> {
    let safeWallet = wallet;
    if (wallet.userAccount.id.network === 'main') {
      if (wallet.nep2 === undefined) {
        throw new PasswordRequiredError();
      }
      safeWallet = {
        type: 'locked',
        userAccount: wallet.userAccount,
        nep2: wallet.nep2,
      };
    }

    await this.storage.setItem(this.getKey(safeWallet), JSON.stringify(toWalletJSON(safeWallet)));
  }

  public async deleteWallet(wallet: LocalWallet): Promise<void> {
    await this.storage.removeItem(this.getKey(wallet));
  }

  private getKey({
    userAccount: {
      id: { network, address },
    },
  }: LocalWallet): string {
    return `${network}-${address}`;
  }
}
