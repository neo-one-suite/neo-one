import {
  AddressString,
  addressToScriptHash,
  Attribute,
  NetworkType,
  PublicKeyString,
  ScriptBuilderParam,
  scriptBuilderParamTo,
  ScriptBuilderParamToCallbacks,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UserAccount,
  UserAccountID,
  UserAccountProvider,
} from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { NothingToTransferError, NotImplementedError } from '../errors';
import {
  ACCOUNT_CHANGED,
  Argument,
  Dapi,
  DapiAccount,
  DapiError,
  DapiNetworks,
  NETWORK_CHANGED,
  TxHashAttribute,
} from './Dapi';
import {
  ExecuteInvokeMethodOptions,
  ExecuteInvokeScriptOptions,
  Provider,
  UserAccountProviderBase,
} from './UserAccountProviderBase';

const paramToArgDataTypeCallbacks: ScriptBuilderParamToCallbacks<Argument> = {
  undefined: () => ({
    type: 'ByteArray',
    value: Buffer.alloc(0, 0),
  }),
  array: (param) => ({
    type: 'Array',
    value: param.map(paramToArgDataType),
  }),
  map: (param) => ({
    type: 'Array',
    value: Array.from(param).map(([k, v]) => [paramToArgDataType(k), paramToArgDataType(v)]),
  }),
  uInt160: (param) => ({
    type: 'Hash160',
    value: param,
  }),
  uInt256: (param) => ({
    type: 'Hash256',
    value: param,
  }),
  ecPoint: (param) => ({
    type: 'ByteArray',
    value: param,
  }),
  number: (param) => ({
    type: 'Integer',
    value: param,
  }),
  bn: (param) => ({
    type: 'Integer',
    value: param.toString(10),
  }),
  string: (param) => ({
    type: 'String',
    value: param,
  }),
  boolean: (param) => ({
    type: 'Boolean',
    value: param,
  }),
  buffer: (param) => ({
    type: 'ByteArray',
    value: param,
  }),
  object: (param) => ({
    type: 'Array',
    value: Object.entries(param).map(([k, v]) => [paramToArgDataType(k), paramToArgDataType(v)]),
  }),
};

const paramToArgDataType = (param: ScriptBuilderParam): Argument =>
  scriptBuilderParamTo<Argument>(param, paramToArgDataTypeCallbacks);

export class DapiUserAccountProvider<TProvider extends Provider>
  extends UserAccountProviderBase<TProvider>
  implements UserAccountProvider
{
  public readonly currentUserAccount$: Observable<UserAccount | undefined>;
  public readonly userAccounts$: Observable<ReadonlyArray<UserAccount>>;
  public readonly networks$: Observable<ReadonlyArray<NetworkType>>;
  private readonly dapi: Dapi;
  private mutableInitPromise: Promise<void>;
  private readonly currentAccountInternal$: BehaviorSubject<UserAccount | undefined>;
  private readonly userAccountsInternal$: BehaviorSubject<ReadonlyArray<UserAccount>>;
  private readonly networksInternal$: BehaviorSubject<ReadonlyArray<NetworkType>>;
  private readonly defaultNetworkInternal$: BehaviorSubject<NetworkType | undefined>;

  public constructor({
    dapi,
    provider,
    onError,
  }: {
    readonly dapi: Dapi;
    readonly provider: TProvider;
    readonly onError?: (error: DapiError) => void;
  }) {
    super({ provider });
    this.dapi = dapi;
    this.mutableInitPromise = this.init();

    this.userAccountsInternal$ = new BehaviorSubject<ReadonlyArray<UserAccount>>([]);
    this.currentAccountInternal$ = new BehaviorSubject<UserAccount | undefined>(undefined);
    this.networksInternal$ = new BehaviorSubject<ReadonlyArray<NetworkType>>([]);
    this.defaultNetworkInternal$ = new BehaviorSubject<NetworkType | undefined>(undefined);

    const updateAccount = (networkType: string, dapiAccount: DapiAccount): void => {
      this.dapi
        .getPublicKey()
        .then(({ publicKey, address }) => {
          if (dapiAccount.address === address) {
            this.updateUserAccount({
              network: networkType,
              publicKey,
              ...dapiAccount,
            });
          }
        })
        .catch((err) => {
          if (onError) {
            onError(err);
          }
        });
    };

    let network: string | undefined;
    let account: DapiAccount | undefined;
    this.dapi.addEventListener(ACCOUNT_CHANGED, (dapiAccount) => {
      account = dapiAccount;
      if (network !== undefined) {
        updateAccount(network, dapiAccount);
      }
    });

    this.dapi.addEventListener(NETWORK_CHANGED, (dapiNetworks) => {
      network = dapiNetworks.defaultNetwork;
      this.updateNetworks(dapiNetworks);
      if (account !== undefined) {
        updateAccount(dapiNetworks.defaultNetwork, account);
      }
    });

    this.userAccounts$ = this.userAccountsInternal$;
    this.currentUserAccount$ = this.currentAccountInternal$.pipe(distinctUntilChanged());
    this.networks$ = this.networksInternal$;
  }

  public getCurrentUserAccount(): UserAccount | undefined {
    return this.currentAccountInternal$.getValue();
  }

  public getUserAccounts(): ReadonlyArray<UserAccount> {
    return this.userAccountsInternal$.getValue();
  }

  public getNetworks(): ReadonlyArray<NetworkType> {
    return this.networksInternal$.getValue();
  }

  protected async executeTransfer(
    transfers: ReadonlyArray<Transfer>,
    from: UserAccountID,
    _attributes: readonly Attribute[],
    networkFee: BigNumber,
  ): Promise<TransactionResult> {
    await this.initCheck();
    if (transfers.length === 0) {
      throw new NothingToTransferError();
    }
    if (transfers.length > 1) {
      throw new NotImplementedError('Multiple transfers per transaction');
    }

    const { amount, asset, to } = transfers[0];

    const { txid } = await this.dapi.send({
      fromAddress: from.address,
      toAddress: to,
      asset,
      amount: amount.toString(),
      fee: networkFee.toString(),
      network: from.network,
    });
    const transaction = await this.provider.getTransaction(from.network, txid);

    return {
      transaction,
      confirmed: async () => this.provider.getTransactionReceipt(from.network, txid),
    };
  }

  protected async executeClaim(
    _from: UserAccountID,
    _attributes: readonly Attribute[],
    _networkFee: BigNumber,
  ): Promise<TransactionResult> {
    throw new NotImplementedError('executeClaim');
  }

  protected async executeInvokeScript<T extends TransactionReceipt>(
    _options: ExecuteInvokeScriptOptions<T>,
  ): Promise<TransactionResult<T>> {
    throw new NotImplementedError('executeInvokeScript');
  }

  protected async executeInvokeMethod<T extends TransactionReceipt>({
    invokeMethodOptions,
    from,
    attributes,
    verify,
    onConfirm,
  }: ExecuteInvokeMethodOptions<T>): Promise<TransactionResult<T>> {
    await this.initCheck();
    const { contract, invokeMethod, params } = invokeMethodOptions;

    const { txid } = await this.dapi.invoke({
      scriptHash: addressToScriptHash(contract),
      operation: invokeMethod,
      args: params.map(paramToArgDataType),
      network: this.defaultNetworkInternal$.getValue(),
      triggerContractVerification: verify,
      txHashAttributes: this.convertDapiAttributes(attributes),
    });

    const transaction = await this.provider.getTransaction(from.network, txid);

    return {
      transaction,
      confirmed: async () => {
        const [receipt, data] = await Promise.all([
          this.provider.getTransactionReceipt(from.network, txid),
          this.provider.getTransactionData(from.network, txid),
        ]);

        return onConfirm({ transaction, receipt, data });
      },
    };
  }

  private convertDapiAttributes(attributes: readonly Attribute[]): readonly TxHashAttribute[] {
    return attributes.map((attribute) => ({
      txAttrType: attribute.type,
    }));
  }

  private async init(): Promise<void> {
    await new Promise<void>(async (resolve, reject) => {
      this.dapi.addEventListener('READY', resolve);
      setTimeout(() => reject(new Error(`Timed out waiting for Provider to emit 'READY'.`)), 10000);
    });

    const [{ networks, defaultNetwork }, { publicKey }, { address, label }] = await Promise.all([
      this.dapi.getNetworks(),
      this.dapi.getPublicKey(),
      this.dapi.getAccount(),
    ]);

    this.updateNetworks({ networks, defaultNetwork });
    this.updateUserAccount({ network: defaultNetwork, publicKey, address, label });
  }

  private async initCheck(): Promise<void> {
    try {
      await this.mutableInitPromise;
    } catch (error) {
      this.mutableInitPromise = this.init();
      throw error;
    }
  }

  private updateUserAccount({
    network,
    publicKey,
    address,
    label,
  }: {
    readonly network: NetworkType;
    readonly publicKey: PublicKeyString;
    readonly address: AddressString;
    readonly label?: string;
  }) {
    const userAccount: UserAccount = {
      id: {
        address,
        network,
      },
      name: label === undefined ? address : label,
      publicKey,
    };

    this.currentAccountInternal$.next(userAccount);
    this.userAccountsInternal$.next([userAccount]);
  }

  private updateNetworks({ networks, defaultNetwork }: DapiNetworks) {
    this.networksInternal$.next(networks);
    this.defaultNetworkInternal$.next(defaultNetwork);
  }
}
