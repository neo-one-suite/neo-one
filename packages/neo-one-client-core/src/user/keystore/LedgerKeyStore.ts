import {
  Account,
  AddressString,
  NetworkType,
  PublicKeyString,
  publicKeyToAddress,
  UserAccount,
  UserAccountID,
} from '@neo-one/client-common';
import { Monitor } from '@neo-one/monitor';
import { mergeScanLatest, utils } from '@neo-one/utils';
import _ from 'lodash';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { UnknownAccountError } from '../../errors';
import { KeyStore } from '../LocalUserAccountProvider';
import { LedgerHandler } from './LedgerHandler';

type Ledgers = { readonly [Network in string]?: { readonly [Address in string]?: Ledger } };

interface Ledger {
  readonly accountKey: number;
  readonly account: UserAccount;
}

export interface LedgerProvider {
  readonly getNetworks: () => ReadonlyArray<NetworkType>;
  readonly networks$: Observable<ReadonlyArray<NetworkType>>;
  readonly getAccount: (network: NetworkType, address: AddressString, monitor?: Monitor) => Promise<Account>;
}

interface Handler {
  readonly byteLimit: number;
  readonly init: () => Promise<ConnectedHandler>;
}

interface ConnectedHandler {
  readonly getPublicKey: (account?: number) => Promise<PublicKeyString>;
  readonly sign: (
    options: {
      readonly message: Buffer;
      readonly account: number;
    },
  ) => Promise<Buffer>;
  readonly close: () => Promise<void>;
}

interface ScanInterface {
  readonly ledgers: Ledgers;
  readonly scannedNetworks: Set<NetworkType>;
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

/**
 * Implements the `KeyStore` interface expected by `LocalUserAccountProvider` using a ledger.
 */
export class LedgerKeyStore implements KeyStore {
  public readonly byteLimit: number;
  public readonly currentUserAccount$: Observable<UserAccount | undefined>;
  public readonly userAccounts$: Observable<ReadonlyArray<UserAccount>>;
  private readonly ledgerHandler: Handler;
  private readonly initPromise: Promise<ConnectedHandler>;
  private readonly provider: LedgerProvider;
  private readonly ledgers$: Observable<ReadonlyArray<Ledger>>;
  private readonly currentAccountInternal$: BehaviorSubject<UserAccount | undefined>;
  private readonly accountsInternal$: BehaviorSubject<ReadonlyArray<UserAccount>>;
  private readonly ledgersInternal$: BehaviorSubject<Ledgers>;
  private readonly ledgersSubscription: Subscription;

  public constructor(provider: LedgerProvider, handlerIn?: Handler) {
    this.ledgerHandler = handlerIn === undefined ? LedgerHandler : handlerIn;
    this.byteLimit = this.ledgerHandler.byteLimit;
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
    this.userAccounts$ = this.accountsInternal$;

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
    this.currentUserAccount$ = this.currentAccountInternal$.pipe(distinctUntilChanged());
  }

  public getCurrentUserAccount(): UserAccount | undefined {
    return this.currentAccountInternal$.getValue();
  }

  public getUserAccounts(): ReadonlyArray<UserAccount> {
    return this.accountsInternal$.getValue();
  }

  public getNetworks(): ReadonlyArray<NetworkType> {
    return this.provider.getNetworks();
  }

  public async selectUserAccount(id?: UserAccountID, _monitor?: Monitor): Promise<void> {
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
  }): Promise<string> {
    const handler = await this.initPromise;

    return this.capture(
      async () => {
        const ledger = this.getLedger(account);
        const response = await handler.sign({
          message: Buffer.from(message, 'hex'),
          account: ledger.accountKey,
        });

        return response.toString('hex');
      },
      'neo_ledger_sign',
      monitor,
    );
  }

  public async close(): Promise<void> {
    const handler = await this.initPromise;
    this.ledgersSubscription.unsubscribe();
    await handler.close();
  }

  private getLedger({ address, network }: UserAccountID): Ledger {
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

  private async init(): Promise<ConnectedHandler> {
    return this.ledgerHandler.init();
  }

  private async scanLedgerAccounts(
    handler: ConnectedHandler,
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

      const unscannedAccounts = await Promise.all(
        ledgerAccounts.map(async (ledger) => {
          const { balances } = await this.provider.getAccount(network, ledger.account.publicKey);

          return {
            empty: Object.values(balances).every((balance) => balance.isEqualTo(0)),
            ledger,
          };
        }),
      );

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
        id: {
          network,
          address: publicKeyToAddress(publicKey),
        },
        name: accountVal.toString(),
        publicKey,
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

  private get ledgers(): Ledgers {
    return this.ledgersInternal$.getValue();
  }
}
