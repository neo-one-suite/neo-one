import {
  AddressString,
  addressToScriptHash,
  Attribute,
  common,
  Input,
  InvalidParamError,
  InvocationTransaction,
  NetworkType,
  Output,
  PublicKeyString,
  ScriptBuilderParam,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UserAccount,
  UserAccountProvider,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { clientUtils } from '../clientUtils';
import { InvalidArgumentError, InvocationCallError, NotImplementedError } from '../errors';
import { Argument, AssetInput, AssetOutput, Dapi, DapiNetworks, TxHashAttribute } from './Dapi';
import { InvokeRawOptions, Provider, UserAccountProviderBase } from './UserAccountProviderBase';

// Maintain consistency with @neo-one/client-common/src/ScriptBuilder.ts
const paramToArgDataType = (value: ScriptBuilderParam | undefined): Argument => {
  if (value === undefined) {
    return {
      type: 'ByteArray',
      value: Buffer.alloc(0, 0),
    };
  }
  if (Array.isArray(value)) {
    return {
      type: 'Array',
      value: (value as ReadonlyArray<ScriptBuilderParam>).map(paramToArgDataType),
    };
  }
  if (value instanceof Map) {
    return {
      type: 'Array',
      value: Array.from(value).map(([k, v]) => [paramToArgDataType(k), paramToArgDataType(v)]),
    };
  }
  if (common.isUInt160(value)) {
    return {
      type: 'Hash160',
      value,
    };
  }
  if (common.isUInt256(value)) {
    return {
      type: 'Hash256',
      value,
    };
  }
  if (BN.isBN(value) || typeof value === 'number') {
    return {
      type: 'Integer',
      value,
    };
  }
  if (typeof value === 'string') {
    return {
      type: 'String',
      value,
    };
  }
  if (typeof value === 'boolean') {
    return {
      type: 'Boolean',
      value,
    };
  }
  if (value instanceof Buffer) {
    return {
      type: 'ByteArray',
      value,
    };
  }
  // tslint:disable-next-line strict-type-predicates
  if (typeof value === 'object') {
    return {
      type: 'Array',
      value: Object.entries(value).map(([k, v]) => [paramToArgDataType(k), paramToArgDataType(v)]),
    };
  }

  /* istanbul ignore next */
  throw new InvalidParamError(typeof value);
};

export class DapiUserAccountProvider<TProvider extends Provider> extends UserAccountProviderBase<TProvider>
  implements UserAccountProvider {
  public readonly currentUserAccount$: Observable<UserAccount | undefined>;
  public readonly userAccounts$: Observable<ReadonlyArray<UserAccount>>;
  public readonly networks$: Observable<ReadonlyArray<NetworkType>>;
  private readonly dapi: Dapi;
  private readonly initPromise: Promise<void>;
  private readonly currentAccountInternal$: BehaviorSubject<UserAccount | undefined>;
  private readonly userAccountsInternal$: BehaviorSubject<ReadonlyArray<UserAccount>>;
  private readonly networksInternal$: BehaviorSubject<ReadonlyArray<NetworkType>>;
  private readonly defaultNetworkInternal$: BehaviorSubject<NetworkType | undefined>;

  public constructor({ dapi, provider }: { readonly dapi: Dapi; readonly provider: TProvider }) {
    super({ provider });
    this.dapi = dapi;
    this.initPromise = this.init();

    this.userAccountsInternal$ = new BehaviorSubject<ReadonlyArray<UserAccount>>([]);
    this.currentAccountInternal$ = new BehaviorSubject<UserAccount | undefined>(undefined);
    this.networksInternal$ = new BehaviorSubject<ReadonlyArray<NetworkType>>([]);
    this.defaultNetworkInternal$ = new BehaviorSubject<NetworkType | undefined>(undefined);

    this.dapi.addEventListener('ACCOUNT_CHANGED', ({ address, label }) => {
      this.dapi
        .getPublicKey()
        .then(({ publicKey }) => {
          this.updateUserAccount({
            network: this.defaultNetworkInternal$.getValue() as NetworkType,
            publicKey,
            address,
            label,
          });
        })
        .catch(() => {
          // do nothing
        });
    });
    this.dapi.addEventListener('NETWORK_CHANGED', (dapiNetworks) => {
      this.updateNetworks(dapiNetworks);
    });
    this.dapi.addEventListener('DISCONNECTED', () => {
      throw new Error(`The account connected to the dapp via the dapi provider has been disconnected (logged out).`);
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

  public async transfer(
    transfers: ReadonlyArray<Transfer>,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt, InvocationTransaction>> {
    await this.initPromise;
    if (transfers.length !== 1) {
      throw new NotImplementedError('Multiple transfers per transaction');
    }
    const { from, networkFee, systemFee } = this.getTransactionOptions(options);

    const { amount, asset, to } = transfers[0];

    const { txid } = await this.dapi.send({
      fromAddress: from.address,
      toAddress: to,
      asset,
      amount: amount.toString(),
      fee: systemFee.plus(networkFee).toString(),
      network: from.network,
    });
    const transaction = (await this.provider.getTransaction(from.network, txid)) as InvocationTransaction;

    return {
      transaction,
      confirmed: async () => this.provider.getTransactionReceipt(from.network, txid),
    };
  }

  protected async invokeRaw<T extends TransactionReceipt>({
    options = {},
    invokeMethodOptions,
    verify = true,
    transfers = [],
    rawInputs = [],
    rawOutputs = [],
    scripts,
    onConfirm,
    reorderOutputs = (outs) => outs,
  }: InvokeRawOptions<T>): Promise<TransactionResult<T, InvocationTransaction>> {
    await this.initPromise;
    const {
      from,
      script,
      attributes: attributesIn,
      networkFee,
      systemFee,
      contract,
      invokeMethod: method,
      params,
    } = this.invokeRawSetup(options, invokeMethodOptions);

    const { attributes, inputs, outputs } = await this.invokeRawGetInputsOutputs(
      script,
      from,
      networkFee,
      systemFee,
      attributesIn,
      transfers,
      rawInputs,
      rawOutputs,
      scripts,
    );

    const { txid } = await this.dapi.invoke({
      scriptHash: addressToScriptHash(contract),
      operation: method,
      args: params.map(paramToArgDataType),
      network: this.defaultNetworkInternal$.getValue(),
      triggerContractVerification: verify,
      txHashAttributes: this.convertDapiAttributes(attributes),
      assetIntentOverrides: {
        inputs: this.convertDapiInputs(rawInputs.concat(inputs)),
        outputs: this.convertDapiOutputs(reorderOutputs(rawOutputs.concat(outputs))),
      },
    });

    const transaction = await this.provider.getTransaction(from.network, txid);
    if (transaction.type !== 'InvocationTransaction') {
      throw new InvocationCallError(`Expected InvocationTransaction, received ${transaction.type}`);
    }

    return {
      transaction,
      confirmed: async () => {
        const [receipt, data] = await Promise.all([
          this.provider.getTransactionReceipt(from.network, txid),
          this.provider.getInvocationData(from.network, txid),
        ]);

        return onConfirm({ transaction, receipt, data });
      },
    };
  }

  private convertDapiAttributes(attributes: readonly Attribute[]): readonly TxHashAttribute[] {
    return attributes.map((attribute) => {
      const argBase = paramToArgDataType(attribute.data);

      return {
        ...argBase,
        txAttrUsage: attribute.usage,
      };
    });
  }

  private async init(): Promise<void> {
    await new Promise<void>((resolve) => {
      function listener() {
        resolve();
      }

      this.dapi.addEventListener('READY', listener);
    });

    const [{ networks, defaultNetwork }, { publicKey }, { address, label }] = await Promise.all([
      this.dapi.getNetworks(),
      this.dapi.getPublicKey(),
      this.dapi.getAccount(),
    ]);

    this.updateNetworks({ networks, defaultNetwork });
    this.updateUserAccount({ network: defaultNetwork, publicKey, address, label });
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
    readonly label: string | undefined;
  }) {
    const userAccount = {
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

  private convertDapiInputs(inputs: ReadonlyArray<Input>): ReadonlyArray<AssetInput> {
    return inputs.map((input) => ({
      txid: input.hash,
      index: input.index,
    }));
  }

  private convertDapiOutputs(outputs: ReadonlyArray<Output>): ReadonlyArray<AssetOutput> {
    return outputs.map((output) => ({
      asset: output.asset,
      address: output.address,
      value: output.value.toString(),
    }));
  }
}
