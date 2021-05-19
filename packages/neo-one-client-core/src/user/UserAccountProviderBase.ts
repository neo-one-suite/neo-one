import {
  Account,
  AddressString,
  addressToScriptHash,
  Attribute,
  AttributeModel,
  Block,
  Contract,
  ForwardValue,
  GetOptions,
  Hash256String,
  InvokeSendUnsafeReceiveTransactionOptions,
  IterOptions,
  NetworkSettings,
  NetworkType,
  Param,
  ParamJSON,
  RawApplicationLogData,
  RawCallReceipt,
  RawInvokeReceipt,
  ScriptBuilderParam,
  SourceMaps,
  Transaction,
  TransactionModel,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UInt160Hex,
  UserAccount,
  UserAccountID,
  utils,
  Witness,
  WitnessModel,
} from '@neo-one/client-common';
import { processConsoleLogMessages } from '@neo-one/client-switch';
import { Labels, utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import debug from 'debug';
import _ from 'lodash';
import { Observable } from 'rxjs';
import { clientUtils } from '../clientUtils';
import { InsufficientSystemFeeError, InvokeError, NoAccountError, NotImplementedError } from '../errors';
import { converters } from './converters';

const logger = debug('NEOONE:LocalUserAccountProvider');

export interface InvokeMethodOptions {
  readonly scriptHash: UInt160Hex;
  readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
  readonly invokeMethod: string;
}

export interface InvokeRawOptions<T extends TransactionReceipt> {
  readonly invokeMethodOptionsOrScript: InvokeMethodOptions | Buffer;
  readonly transfers?: readonly FullTransfer[];
  readonly options?: TransactionOptions;
  readonly verify?: boolean;
  readonly onConfirm: (options: {
    readonly transaction: Transaction;
    readonly data: RawApplicationLogData;
    readonly receipt: TransactionReceipt;
  }) => Promise<T> | T;
  readonly method: string;
  readonly witnesses?: readonly WitnessModel[];
  readonly labels?: Record<string, string>;
  readonly sourceMaps?: SourceMaps;
}

export interface ExecuteInvokeScriptOptions<T extends TransactionReceipt> {
  readonly script: Buffer;
  readonly from: UserAccountID;
  readonly attributes: readonly Attribute[];
  readonly maxSystemFee: BigNumber;
  readonly maxNetworkFee: BigNumber;
  readonly validBlockCount: number;
  readonly witnesses: readonly WitnessModel[];
  readonly onConfirm: (options: {
    readonly transaction: Transaction;
    readonly data: RawApplicationLogData;
    readonly receipt: TransactionReceipt;
  }) => Promise<T> | T;
  readonly sourceMaps?: SourceMaps;
}

export interface ExecuteInvokeMethodOptions<T extends TransactionReceipt> extends ExecuteInvokeScriptOptions<T> {
  readonly invokeMethodOptions: InvokeMethodOptions;
}

export interface Provider {
  readonly networks$: Observable<readonly NetworkType[]>;
  readonly getNetworks: () => readonly NetworkType[];
  readonly getUnclaimed: (network: NetworkType, address: AddressString) => Promise<BigNumber>;
  readonly getTransactionReceipt: (
    network: NetworkType,
    hash: Hash256String,
    options?: GetOptions,
  ) => Promise<TransactionReceipt>;
  readonly getApplicationLogData: (network: NetworkType, hash: Hash256String) => Promise<RawApplicationLogData>;
  readonly testInvoke: (network: NetworkType, script: Buffer) => Promise<RawCallReceipt>;
  readonly testTransaction: (network: NetworkType, transaction: TransactionModel) => Promise<RawCallReceipt>;
  readonly call: (
    network: NetworkType,
    contract: UInt160Hex,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
  ) => Promise<RawCallReceipt>;
  readonly getNetworkSettings: (network: NetworkType) => Promise<NetworkSettings>;
  readonly getBlockCount: (network: NetworkType) => Promise<number>;
  readonly getFeePerByte: (network: NetworkType) => Promise<BigNumber>;
  readonly getExecFeeFactor: (network: NetworkType) => Promise<number>;
  readonly getTransaction: (network: NetworkType, hash: Hash256String) => Promise<Transaction>;
  readonly iterBlocks: (network: NetworkType, options?: IterOptions) => AsyncIterable<Block>;
  readonly getAccount: (network: NetworkType, address: AddressString) => Promise<Account>;
  readonly getContract: (network: NetworkType, address: AddressString) => Promise<Contract>;
  readonly getVerificationCost: (
    network: NetworkType,
    hash: UInt160Hex,
    transaction: TransactionModel,
  ) => Promise<{
    readonly fee: BigNumber;
    readonly size: number;
  }>;
}

interface TransactionOptionsFull {
  readonly from: UserAccountID;
  readonly attributes: readonly Attribute[];
  readonly maxNetworkFee: BigNumber;
  readonly maxSystemFee: BigNumber;
  readonly validBlockCount: number;
}

interface FullTransfer extends Transfer {
  readonly from: UserAccountID;
}

export abstract class UserAccountProviderBase<TProvider extends Provider> {
  public readonly provider: TProvider;
  protected mutableBlockCount: number;

  public constructor({ provider }: { readonly provider: TProvider }) {
    this.provider = provider;

    this.mutableBlockCount = 0;
  }

  public getCurrentUserAccount(): UserAccount | undefined {
    throw new NotImplementedError('getCurrentUserAccount');
  }

  public getUserAccounts(): readonly UserAccount[] {
    throw new NotImplementedError('getUserAccounts');
  }

  public getNetworks(): readonly NetworkType[] {
    throw new NotImplementedError('getNetworks');
  }

  public async selectUserAccount(_id?: UserAccountID): Promise<void> {
    throw new NotImplementedError('selectUserAccount');
  }

  public iterBlocks(network: NetworkType, options?: IterOptions): AsyncIterable<Block> {
    return this.provider.iterBlocks(network, options);
  }

  public async getBlockCount(network: NetworkType): Promise<number> {
    return this.provider.getBlockCount(network);
  }

  public async getAccount(network: NetworkType, address: AddressString): Promise<Account> {
    return this.provider.getAccount(network, address);
  }

  public async transfer(transfers: readonly Transfer[], options?: TransactionOptions): Promise<TransactionResult> {
    const { from, attributes, maxNetworkFee, maxSystemFee, validBlockCount } = this.getTransactionOptions(options);

    return this.capture(
      async () => this.executeTransfer(transfers, from, attributes, maxNetworkFee, maxSystemFee, validBlockCount),
      {
        name: 'neo_transfer',
      },
    );
  }

  public async claim(options?: TransactionOptions): Promise<TransactionResult> {
    const { from, attributes, maxNetworkFee, maxSystemFee, validBlockCount } = this.getTransactionOptions(options);

    return this.capture(async () => this.executeClaim(from, attributes, maxNetworkFee, maxSystemFee, validBlockCount), {
      name: 'neo_claim',
    });
  }

  public async invoke(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    verify: boolean,
    options: InvokeSendUnsafeReceiveTransactionOptions = {},
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResult<RawInvokeReceipt>> {
    const { attributes = [] } = options;
    const transactionOptions = this.getTransactionOptions(options);
    const { from } = transactionOptions;

    const send = options.sendFrom === undefined ? [] : options.sendFrom;
    const receive = options.sendTo === undefined ? [] : options.sendTo;
    const contractID: UserAccountID = {
      address: contract,
      network: from.network,
    };

    return this.invokeRaw({
      invokeMethodOptionsOrScript: {
        scriptHash: addressToScriptHash(contract),
        invokeMethod: method,
        params,
      },
      transfers: send
        .map((transfer) => ({ ...transfer, from: contractID }))
        .concat(receive.map((transfer) => ({ ...transfer, from, to: contract }))),
      options: {
        ...transactionOptions,
        attributes: attributes.concat(
          this.getInvokeAttributes(
            contract,
            method,
            paramsZipped,
            // If we are sending from the contract, the script is already added as an input
            verify && options.sendFrom === undefined && options.sendTo !== undefined,
            // If we are sending to the contract, the script is already added as an input
            // If we are sending from the contract, the script will not be automatically added in sendTransaction
            options.sendTo === undefined && options.sendFrom !== undefined ? from.address : undefined,
          ),
        ),
      },
      onConfirm: ({ receipt, data: dataIn, transaction }): RawInvokeReceipt => {
        const data = dataIn.executions.length > 0 ? dataIn.executions[0] : undefined;
        if (data === undefined) {
          throw new Error('Expected application log for transaction to have at least one execution');
        }

        return {
          blockIndex: receipt.blockIndex,
          blockHash: receipt.blockHash,
          blockTime: receipt.blockTime,
          transactionIndex: receipt.transactionIndex,
          transactionHash: receipt.transactionHash,
          globalIndex: receipt.globalIndex,
          confirmations: receipt.confirmations,
          state: data.vmState,
          stack: typeof data.stack === 'string' ? [] : data.stack, // TODO: fix
          gasConsumed: data.gasConsumed,
          script: Buffer.from(transaction.script, 'hex'),
          logs: data.logs,
          notifications: data.notifications,
        };
      },
      // TODO: what to do here? Related to attaching transfers to method invocation
      witnesses: this.getInvokeScripts(
        method,
        params,
        verify && (options.sendFrom !== undefined || options.sendTo !== undefined),
      ),
      method: 'invoke',
      labels: {
        [Labels.INVOKE_METHOD]: method,
      },
      sourceMaps,
    });
  }

  public async call(
    network: NetworkType,
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
  ): Promise<RawCallReceipt> {
    return this.provider.call(network, contract, method, params);
  }

  public async getSystemFee({
    network,
    transaction,
    maxFee,
  }: {
    readonly network: NetworkType;
    readonly transaction: TransactionModel;
    readonly maxFee: BigNumber;
  }): Promise<BigNumber> {
    const tx = transaction.clone({
      witnesses: _.fill(
        // tslint:disable-next-line: prefer-array-literal
        Array(transaction.signers.length),
        new WitnessModel({ invocation: Buffer.from([]), verification: Buffer.from([]) }),
      ),
    });
    const callReceipt = await this.provider.testTransaction(network, tx);

    await processConsoleLogMessages({ actions: [...callReceipt.logs, ...callReceipt.notifications] });

    if (callReceipt.state === 'FAULT') {
      throw new InvokeError(callReceipt.state);
    }

    const gas = callReceipt.gasConsumed.integerValue(BigNumber.ROUND_UP);
    if (gas.gt(utils.ZERO_BIG_NUMBER) && maxFee.lt(gas) && !maxFee.eq(utils.NEGATIVE_ONE_BIG_NUMBER)) {
      throw new InsufficientSystemFeeError(maxFee, gas);
    }

    return gas;
  }

  protected getTransactionOptions(options: TransactionOptions = {}): TransactionOptionsFull {
    const {
      attributes = [],
      maxNetworkFee = utils.ZERO_BIG_NUMBER,
      maxSystemFee = utils.ZERO_BIG_NUMBER,
      from: fromIn,
      validBlockCount = 86400000 / 15000 - 1, // TODO: should not be hardcoded. should come from network settings
    } = options;
    let from = fromIn;

    if (from === undefined) {
      const fromAccount = this.getCurrentUserAccount();
      if (fromAccount === undefined) {
        throw new NoAccountError();
      }
      from = fromAccount.id;
    }

    return {
      from,
      attributes,
      maxNetworkFee,
      maxSystemFee,
      validBlockCount,
    };
  }

  // Keep this for now for if they add back transaction attributes later
  protected getInvokeAttributes(
    _contract: AddressString,
    _method: string,
    _paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    _verify: boolean,
    _from?: AddressString,
  ): readonly Attribute[] {
    return [].filter(commonUtils.notNull);
  }

  protected getInvokeScripts(
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    verify: boolean,
  ): readonly WitnessModel[] {
    return [
      verify
        ? new WitnessModel({
            invocation: clientUtils.getInvokeMethodInvocationScript({
              method,
              params,
            }),
            verification: Buffer.alloc(0, 0),
          })
        : undefined,
    ].filter(commonUtils.notNull);
  }

  protected addWitness({
    transaction,
    witness,
  }: {
    readonly transaction: TransactionModel;
    readonly witness: WitnessModel;
  }): TransactionModel {
    return transaction.clone({ witnesses: [witness] });
  }

  protected getInvokeAttributeTag(
    contract: AddressString,
    method: string,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
  ): string {
    return JSON.stringify({
      contract,
      method,
      params: paramsZipped.map(([name, param]) => [name, this.paramToJSON(param)]),
    });
  }

  protected paramToJSON(param: Param): ParamJSON | undefined {
    if (param === undefined) {
      return param;
    }

    if (Array.isArray(param)) {
      return param.map((value) => this.paramToJSON(value));
    }

    if (BigNumber.isBigNumber(param) || param instanceof BigNumber) {
      return param.toString();
    }

    if (typeof param === 'object') {
      return this.paramToJSON((param as ForwardValue).param);
    }

    return param;
  }

  protected convertAttributes(attributes: readonly Attribute[]): readonly AttributeModel[] {
    return attributes.map((attribute) => converters.attribute(attribute));
  }

  protected convertWitness(script: Witness): WitnessModel {
    return converters.witness(script);
  }

  protected async capture<T>(
    func: () => Promise<T>,
    {
      name,
      labels = {},
      invoke = false,
    }: {
      readonly name: string;
      readonly labels?: Record<string, string>;
      readonly invoke?: boolean;
    },
  ): Promise<T> {
    if (invoke) {
      const value = labels[Labels.INVOKE_RAW_METHOD];
      // tslint:disable-next-line: strict-type-predicates
      if (value === undefined) {
        throw new Error('Invocation should have an invoke method');
      }
    }

    try {
      const result = await func();
      logger('%o', { name, level: 'verbose', ...labels });

      return result;
    } catch (error) {
      logger('%o', { name, level: 'error', error: error.message, ...labels });

      throw error;
    }
  }

  protected abstract async executeInvokeMethod<T extends TransactionReceipt>(
    options: ExecuteInvokeMethodOptions<T>,
  ): Promise<TransactionResult<T>>;

  protected abstract async executeInvokeScript<T extends TransactionReceipt>(
    options: ExecuteInvokeScriptOptions<T>,
  ): Promise<TransactionResult<T>>;

  protected abstract async executeTransfer(
    transfers: readonly Transfer[],
    from: UserAccountID,
    attributes: readonly Attribute[],
    maxNetworkFee: BigNumber,
    maxSystemFee: BigNumber,
    validBlockCount: number,
  ): Promise<TransactionResult>;

  protected abstract async executeClaim(
    from: UserAccountID,
    attributes: readonly Attribute[],
    maxNetworkFee: BigNumber,
    maxSystemFee: BigNumber,
    validBlockCount: number,
  ): Promise<TransactionResult>;

  protected async invokeRaw<T extends TransactionReceipt>({
    invokeMethodOptionsOrScript,
    options = {},
    onConfirm,
    method,
    witnesses = [],
    labels = {},
    sourceMaps,
    transfers = [],
  }: InvokeRawOptions<T>) {
    const { from, attributes, maxSystemFee, maxNetworkFee, validBlockCount } = this.getTransactionOptions(options);

    // TODO: need to pass transfers into here to they are include in the script. must be in front of the actual method call?
    // Or are they included as "witnesses" which used to be called scripts?
    const { script, invokeMethodOptions } = this.getScriptAndInvokeMethodOptions(invokeMethodOptionsOrScript);

    return this.capture(
      async () =>
        invokeMethodOptions === undefined
          ? this.executeInvokeScript({
              script,
              from,
              attributes,
              maxSystemFee,
              maxNetworkFee,
              validBlockCount,
              witnesses,
              onConfirm,
              sourceMaps,
            })
          : this.executeInvokeMethod({
              script,
              invokeMethodOptions,
              from,
              attributes,
              maxSystemFee,
              maxNetworkFee,
              validBlockCount,
              witnesses,
              onConfirm,
              sourceMaps,
            }),
      {
        name: 'neo_invoke_raw',
        invoke: true,
        labels: {
          [Labels.INVOKE_RAW_METHOD]: method,
          ...labels,
        },
      },
    );
  }

  private getScriptAndInvokeMethodOptions(invokeMethodOptionsOrScript: InvokeMethodOptions | Buffer): {
    readonly script: Buffer;
    readonly invokeMethodOptions: InvokeMethodOptions | undefined;
  } {
    let script: Buffer;
    let invokeMethodOptions: InvokeMethodOptions | undefined;
    if (invokeMethodOptionsOrScript instanceof Buffer) {
      script = invokeMethodOptionsOrScript;
    } else {
      invokeMethodOptions = invokeMethodOptionsOrScript;
      const { scriptHash, invokeMethod, params } = invokeMethodOptions;
      script = clientUtils.getInvokeMethodScript({
        scriptHash,
        method: invokeMethod,
        params,
      });
    }

    return { script, invokeMethodOptions };
  }
}
