import { AddressString, common, crypto } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import { mergeScanLatest, utils } from '@neo-one/utils';
import _ from 'lodash';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { UnknownAccountError } from '../../errors';
import { publicKeyToAddress } from '../../helpers';
import { Account, NetworkType, UserAccount, UserAccountID, Witness } from '../../types';
import { LedgerHandler } from './LedgerHandler';

export interface Ledger {
  readonly accountKey: number;
  readonly account: UserAccount;
}

export type Ledgers = { readonly [Network in string]?: { readonly [Address in string]?: Ledger } };

export interface LedgerProvider {
  readonly getNetworks: () => ReadonlyArray<NetworkType>;
  readonly networks$: Observable<ReadonlyArray<NetworkType>>;
  readonly getAccount: (network: NetworkType, address: AddressString, monitor?: Monitor) => Promise<Account>;
}

const flattenLedgers = (ledgers: Ledgers) =>
  _.flatten(
    Object.values(ledgers)
      .filter(utils.notNull)
      .map((networkLedgers) => Object.values(networkLedgers)),
  ).filter(utils.notNull);

const getNewNetworks = (networks: Set<NetworkType> | undefined, networksIn: ReadonlyArray<NetworkType>) => {
  if (networks === undefined) {
    return networksIn;
  }

  return networksIn.filter((network) => !networks.has(network));
};

interface ScanInterface {
  readonly ledgers: Ledgers;
  readonly scannedNetworks: Set<NetworkType>;
}

export class LedgerKeyStore {
  public get ledgers(): Ledgers {
    return this.ledgersInternal$.getValue();
  }

  public get currentAccount(): UserAccount | undefined {
    return this.currentAccountInternal$.getValue();
  }
  public readonly type: string;
  public readonly byteLimit: number;
  public readonly currentAccount$: Observable<UserAccount | undefined>;
  public readonly accounts$: Observable<ReadonlyArray<UserAccount>>;

  public readonly initPromise: Promise<LedgerHandler>;
  private readonly provider: LedgerProvider;
  private readonly ledgers$: Observable<ReadonlyArray<Ledger>>;
  private readonly currentAccountInternal$: BehaviorSubject<UserAccount | undefined>;
  private readonly accountsInternal$: BehaviorSubject<ReadonlyArray<UserAccount>>;
  private readonly ledgersInternal$: BehaviorSubject<Ledgers>;
  private readonly ledgersSubscription: Subscription;

  public constructor(provider: LedgerProvider) {
    this.type = LedgerHandler.type;
    this.byteLimit = LedgerHandler.byteLimit;
    this.provider = provider;

    this.initPromise = this.init();

    this.ledgersInternal$ = new BehaviorSubject<Ledgers>({});
    this.ledgersSubscription = this.provider.networks$
      .pipe(
        mergeScanLatest(async (acc: ScanInterface | undefined, networks) => {
          const networksFiltered = getNewNetworks(acc === undefined ? undefined : acc.scannedNetworks, networks);
          const handler = await this.initPromise;
          const next = await Promise.all(
            networksFiltered.map(async (network) => this.scanLedgerAccounts(handler, network)),
          );
          const newLedgers = next.reduce<ReadonlyArray<Ledger>>(
            (accum, newLedgersIn) => accum.concat(newLedgersIn),
            [],
          );

          const nextLedgers = newLedgers.reduce<Ledgers>(
            (accum, ledger) => ({
              ...accum,
              [ledger.account.id.network]: {
                ...(accum[ledger.account.id.network] === undefined ? {} : accum[ledger.account.id.network]),
                [ledger.account.id.address]: ledger,
              },
            }),
            acc === undefined ? {} : acc.ledgers,
          );

          return {
            ledgers: nextLedgers,
            scannedNetworks: acc === undefined ? new Set() : new Set([...acc.scannedNetworks].concat(networksFiltered)),
          };
        }),
        map(({ ledgers }) => ledgers),
      )
      .subscribe(this.ledgersInternal$);

    this.ledgers$ = this.ledgersInternal$.pipe(
      distinctUntilChanged((a, b) => _.isEqual(a, b)),
      map(flattenLedgers),
    );

    this.accountsInternal$ = new BehaviorSubject<ReadonlyArray<UserAccount>>([]);
    this.ledgers$.pipe(map((ledgers) => ledgers.map(({ account }) => account))).subscribe(this.accountsInternal$);
    this.accounts$ = this.accountsInternal$;

    this.currentAccountInternal$ = new BehaviorSubject<UserAccount | undefined>(undefined);
    this.ledgers$
      .pipe(
        map((ledgers) => {
          if (ledgers.length === 0) {
            return undefined;
          }

          return ledgers[Math.max(0, ledgers.length - 2)].account;
        }),
      )
      .subscribe(this.currentAccountInternal$);
    this.currentAccount$ = this.currentAccountInternal$.pipe(distinctUntilChanged());
  }

  public getCurrentAccount(): UserAccount | undefined {
    return this.currentAccountInternal$.getValue();
  }

  public getAccounts(): ReadonlyArray<UserAccount> {
    return this.accountsInternal$.getValue();
  }

  public getNetworks(): ReadonlyArray<NetworkType> {
    return this.provider.getNetworks();
  }

  public async deleteAccount(): Promise<void> {
    throw new Error('not implemented on ledger.');
  }

  public async updateAccountName(): Promise<void> {
    throw new Error('not implemented on ledger.');
  }

  public async selectAccount(id?: UserAccountID, _monitor?: Monitor): Promise<void> {
    if (id === undefined) {
      this.currentAccountInternal$.next(undefined);
    } else {
      const { account } = this.getLedger(id);
      this.currentAccountInternal$.next(account);
    }
  }

  public async sign({
    account,
    message,
    monitor,
  }: {
    readonly account: UserAccountID;
    readonly message: string;
    readonly monitor?: Monitor;
  }): Promise<Witness> {
    const handler = await this.initPromise;

    return this.capture(
      async () => {
        const ledger = this.getLedger(account);
        const response = await handler.sign({
          message: Buffer.from(message, 'hex'),
          account: ledger.accountKey,
        });

        const witness = crypto.createWitnessForSignature(
          Buffer.from(response, 'hex'),
          common.stringToECPoint(ledger.account.publicKey),
        );

        return {
          verification: witness.verification.toString('hex'),
          invocation: witness.invocation.toString('hex'),
        };
      },
      'neo_ledger_sign',
      monitor,
    );
  }

  public getLedger({ address, network }: UserAccountID): Ledger {
    const ledgers = this.ledgers[network];
    if (ledgers === undefined) {
      throw new UnknownAccountError(address);
    }

    const ledger = ledgers[address];
    if (ledger === undefined) {
      throw new UnknownAccountError(address);
    }

    return ledger;
  }

  public async init(): Promise<LedgerHandler> {
    return LedgerHandler.init();
  }

  public async close(): Promise<void> {
    const handler = await this.initPromise;
    this.ledgersSubscription.unsubscribe();
    await handler.close();
  }

  private async scanLedgerAccounts(
    handler: LedgerHandler,
    network: NetworkType,
    maxOffset = 20,
  ): Promise<ReadonlyArray<Ledger>> {
    const scanAccountsInternal = async (start: number, currentOffset = 0): Promise<ReadonlyArray<Ledger>> => {
      const ledgerAccounts = await Promise.all(
        [...Array(maxOffset).keys()].map(async (num) => {
          const key = await handler.getPublicKey(start + num);

          return this.publicKeyToLedgerAccount(start + num, key, network);
        }),
      );

      // console.log(ledgerAccounts);

      const unscannedAccounts = await Promise.all(
        ledgerAccounts.map(async (ledger) => {
          const { balances } = await this.provider.getAccount(network, ledger.account.publicKey);

          return {
            empty: Object.values(balances).every((balance) => balance.isEqualTo(0)),
            ledger,
          };
        }),
      );

      // console.log(unscannedAccounts);

      const { ledgerAccounts: newAccounts, offset: newOffset } = unscannedAccounts.reduce(
        (
          acc: {
            readonly ledgerAccounts: ReadonlyArray<Ledger>;
            readonly offset: number;
          },
          unscanned,
        ) => {
          if (unscanned.empty) {
            return {
              ledgerAccounts: acc.ledgerAccounts.concat(unscanned.ledger),
              offset: acc.offset + 1,
            };
          }

          return {
            ledgerAccounts: acc.ledgerAccounts.concat(unscanned.ledger),
            offset: 1,
          };
        },
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

  private publicKeyToLedgerAccount(accountVal: number, publicKey: string, network: NetworkType): Ledger {
    return {
      accountKey: accountVal,
      account: {
        type: `ledger`,
        id: {
          network,
          address: publicKeyToAddress(publicKey),
        },
        name: accountVal.toString(),
        publicKey,
        configurableName: false,
        deletable: false,
      },
    };
  }

  private async capture<T>(func: (monitor?: Monitor) => Promise<T>, name: string, monitor?: Monitor): Promise<T> {
    if (monitor === undefined) {
      return func();
    }

    return monitor.at('ledger_key_store').captureSpanLog(func, {
      name,
      level: { log: 'verbose', span: 'info' },
      trace: true,
    });
  }
}
