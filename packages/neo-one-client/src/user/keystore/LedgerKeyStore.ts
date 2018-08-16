import { common, crypto } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { UnknownAccountError } from '../../errors';
import { publicKeyToAddress, publicKeyToScriptHash } from '../../helpers';
import { UserAccount, UserAccountID, Witness } from '../../types';
import { LedgerHandler } from './LedgerHandler';

interface Ledger {
  readonly accKey: number;
  readonly account: UserAccount;
}

type Ledgers = { readonly [Network in string]?: { readonly [Address in string]?: Ledger } };

const flattenLedgers = (ledgers: Ledgers) =>
  _.flatten(
    Object.values(ledgers)
      .filter(utils.notNull)
      .map((networkLedgers) => Object.values(networkLedgers)),
  ).filter(utils.notNull);

export class LedgerKeyStore {
  public readonly type: string;
  public readonly byteLimit: number;
  public readonly currentAccount$: Observable<UserAccount | undefined>;
  public readonly accounts$: Observable<ReadonlyArray<UserAccount>>;
  public readonly ledgers$: Observable<ReadonlyArray<Ledger>>;

  private readonly currentAccountInternal$: BehaviorSubject<UserAccount | undefined>;
  private readonly accountsInternal$: BehaviorSubject<ReadonlyArray<UserAccount>>;
  private readonly ledgersInternal$: BehaviorSubject<Ledgers>;

  public constructor() {
    this.type = LedgerHandler.type;
    this.byteLimit = LedgerHandler.byteLimit;

    this.ledgersInternal$ = new BehaviorSubject<Ledgers>({});
    this.ledgers$ = this.ledgersInternal$.pipe(
      distinctUntilChanged((a, b) => _.isEqual(a, b)),
      map(flattenLedgers),
    );

    this.accountsInternal$ = new BehaviorSubject([] as ReadonlyArray<UserAccount>);
    this.ledgers$.pipe(map((ledgers) => ledgers.map(({ account }) => account))).subscribe(this.accountsInternal$);
    this.accounts$ = this.accountsInternal$;

    this.currentAccountInternal$ = new BehaviorSubject(undefined as UserAccount | undefined);
    this.currentAccount$ = this.currentAccountInternal$.pipe(distinctUntilChanged());
  }

  public getCurrentAccount(): UserAccount | undefined {
    return this.currentAccountInternal$.getValue();
  }

  public getAccounts(): ReadonlyArray<UserAccount> {
    return this.accountsInternal$.getValue();
  }

  public get ledgers(): Ledgers {
    return this.ledgersInternal$.getValue();
  }

  public get currentAccount(): UserAccount | undefined {
    return this.currentAccountInternal$.getValue();
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
    const handler = await this.init();

    return this.capture(
      async () => {
        const ledger = this.getLedger(account);

        const response = await handler.sign({ message, account: ledger.accKey });

        const witness = crypto.createWitnessForSignature(
          Buffer.from(response, 'hex'),
          common.asECPoint(ledger.account.publicKey),
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

  public async selectAccount(id?: UserAccountID, _monitor?: Monitor): Promise<void> {
    if (id === undefined) {
      this.currentAccountInternal$.next(undefined);
    } else {
      const { account } = this.getLedger(id);
      this.currentAccountInternal$.next(account);
    }
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

  public getLedgers$({ address, network }: UserAccountID): Observable<Ledger | undefined> {
    return this.ledgersInternal$.pipe(
      map((ledgers) => {
        const networkLedgers = ledgers[network];
        if (networkLedgers === undefined) {
          return undefined;
        }

        return networkLedgers[address];
      }),
    );
  }

  private async init(): Promise<LedgerHandler> {
    const handler = await LedgerHandler.init();
    const accounts = await Promise.all(
      [...Array(5).keys()].map(async (val) => {
        const publicKey = await handler.getPublicKey(val);

        return {
          accKey: val,
          account: {
            type: `ledger`,
            id: {
              network: ':thinking:',
              address: publicKeyToAddress(publicKey),
            },
            name: val.toString(),
            scriptHash: publicKeyToScriptHash(publicKey),
            publicKey,
            configurableName: false,
            deletable: false,
          },
        };
      }),
    );

    await this.initWithLedgers(accounts);

    return handler;
  }

  private initWithLedgers(accountsToLedgers: ReadonlyArray<Ledger>): void {
    const ledgers = accountsToLedgers.reduce<Ledgers>(
      (acc, ledger) => ({
        ...acc,
        [ledger.account.id.network]: {
          ...(acc[ledger.account.id.network] === undefined ? {} : acc[ledger.account.id.network]),
          [ledger.account.id.address]: ledger,
        },
      }),
      {},
    );

    this.ledgersInternal$.next(ledgers);
    this.newCurrentAccount();
  }

  private newCurrentAccount(): void {
    const allAccounts = flattenLedgers(this.ledgers).map(({ account: value }) => value);

    const account = allAccounts[0];
    this.currentAccountInternal$.next(account);
  }

  private async capture<T>(func: (monitor?: Monitor) => Promise<T>, name: string, monitor?: Monitor): Promise<T> {
    if (monitor === undefined) {
      return func();
    }

    return monitor.at('local_key_store').captureSpanLog(func, {
      name,
      level: { log: 'verbose', span: 'info' },
      trace: true,
    });
  }
}
