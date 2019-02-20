import { Account, AddressString, NetworkType, publicKeyToAddress } from '@neo-one/client-common';
import { Monitor } from '@neo-one/monitor';
import _ from 'lodash';
import { HDAccount, HDHandler } from './HDKeyStore';
import { LedgerStore } from './LedgerStore';

export type Ledger = HDAccount<number>;

export class LedgerHandler implements HDHandler<number> {
  public static readonly byteLimit = LedgerStore.byteLimit;

  private readonly storePromise: Promise<LedgerStore>;
  private readonly getAccount: (network: NetworkType, address: AddressString, monitor?: Monitor) => Promise<Account>;

  public constructor(
    getAccount: (network: NetworkType, address: AddressString, monitor?: Monitor) => Promise<Account>,
  ) {
    this.getAccount = getAccount;
    this.storePromise = LedgerStore.init();
  }

  public async sign(options: { readonly message: Buffer; readonly account: number }): Promise<Buffer> {
    const store = await this.storePromise;

    return store.sign(options);
  }

  public async scanAccounts(network: NetworkType, maxOffset = 10): Promise<ReadonlyArray<Ledger>> {
    const store = await this.storePromise;
    const scanAccountsInternal = async (start: number, currentOffset = 0): Promise<ReadonlyArray<Ledger>> => {
      const ledgerAccounts = await Promise.all(
        _.range(start, start + maxOffset).map(async (num) => {
          const key = await store.getPublicKey(num);

          return this.publicKeyToLedgerAccount(num, key, network);
        }),
      );

      const unscannedAccounts = await Promise.all(
        ledgerAccounts.map(async (ledger) => {
          const { balances } = await this.getAccount(network, ledger.userAccount.publicKey);

          return {
            empty: Object.values(balances).every((balance) => balance.isEqualTo(0)),
            ledger,
          };
        }),
      );

      const { ledgerAccounts: newAccounts, offset: newOffset } = unscannedAccounts.reduce<{
        readonly ledgerAccounts: ReadonlyArray<Ledger>;
        readonly offset: number;
      }>(
        (acc, unscanned) => ({
          ledgerAccounts: acc.ledgerAccounts.concat(unscanned.ledger),
          offset: unscanned.empty ? acc.offset + 1 : 1,
        }),
        { ledgerAccounts: [], offset: currentOffset },
      );

      if (newOffset < maxOffset) {
        const nextAccounts = await scanAccountsInternal(start + maxOffset, newOffset);

        return newAccounts.concat(nextAccounts);
      }

      return newAccounts.slice(newOffset - maxOffset, maxOffset);
    };

    const accounts = await scanAccountsInternal(0);

    return accounts.slice(0, accounts.length - (maxOffset - 2));
  }

  public async close(): Promise<void> {
    const store = await this.storePromise;

    await store.close();
  }

  private publicKeyToLedgerAccount(accountVal: number, publicKey: string, network: NetworkType): Ledger {
    return {
      identifier: accountVal,
      userAccount: {
        id: {
          network,
          address: publicKeyToAddress(publicKey),
        },
        name: accountVal.toString(),
        publicKey,
      },
    };
  }
}
