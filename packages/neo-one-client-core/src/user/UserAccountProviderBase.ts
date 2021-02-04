import {
  Account,
  AddressString,
  addressToScriptHash,
  Attribute,
  AttributeModel,
  Block,
  common,
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
  RawInvocationData,
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
import { Labels, utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import debug from 'debug';
import { Observable } from 'rxjs';
import { clientUtils } from '../clientUtils';
import {
  InsufficientSystemFeeError,
  InvokeError,
  NoAccountError,
  NothingToClaimError,
  NotImplementedError,
} from '../errors';
import { converters } from './converters';

const logger = debug('NEOONE:LocalUserAccountProvider');

export interface InvokeMethodOptions {
  readonly contract: AddressString;
  readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
  readonly invokeMethod: string;
}

export interface InvokeRawOptions<T extends TransactionReceipt> {
  readonly invokeMethodOptionsOrScript: InvokeMethodOptions | Buffer;
  readonly transfers?: readonly FullTransfer[];
  readonly options?: TransactionOptions;
  readonly verify?: boolean;
  // TODO: fix onConfirm type. return type from node is no longer valid
  readonly onConfirm: (options: {
    readonly transaction: Transaction;
    readonly data: RawInvocationData;
    readonly receipt: TransactionReceipt;
  }) => Promise<T> | T;
  readonly method: string;
  readonly witnesses?: readonly WitnessModel[];
  readonly labels?: Record<string, string>;
  readonly sourceMaps?: SourceMaps;
  readonly networkFee?: BigNumber;
}

export interface ExecuteInvokeScriptOptions<T extends TransactionReceipt> {
  readonly script: Buffer;
  readonly from: UserAccountID;
  readonly attributes: readonly Attribute[];
  readonly systemFee: BigNumber; // TODO: is this name change appropriate (from "gas" to "systemFee")?
  readonly networkFee?: BigNumber; // TODO: is this addition appropriate?
  readonly witnesses: readonly WitnessModel[];
  readonly verify: boolean;
  // TODO: fix onConfirm type. return type from node is no longer valid
  readonly onConfirm: (options: {
    readonly transaction: Transaction;
    readonly data: RawInvocationData;
    readonly receipt: TransactionReceipt;
  }) => Promise<T> | T;
  readonly sourceMaps?: SourceMaps;
}

export interface ExecuteInvokeMethodOptions<T extends TransactionReceipt> extends ExecuteInvokeScriptOptions<T> {
  readonly invokeMethodOptions: InvokeMethodOptions;
}

export interface ExecuteInvokeClaimOptions {
  readonly contract: AddressString;
  readonly unclaimedAmount: BigNumber;
  readonly attributes: readonly Attribute[];
  readonly method: string;
  readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
  readonly paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>;
  readonly from: UserAccountID;
  readonly sourceMaps?: SourceMaps;
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
        contract,
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
      onConfirm: ({ receipt, data }): RawInvokeReceipt => ({
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        blockTime: receipt.blockTime,
        transactionIndex: receipt.transactionIndex,
        transactionHash: receipt.transactionHash,
        globalIndex: receipt.globalIndex,
        confirmations: receipt.confirmations,
        result: data.result,
        actions: data.actions,
      }),
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

  // TODO?
  public async invokeSend(
    contract: AddressString,
    method: string,
    paramsIn: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    transfer: Transfer,
    options: TransactionOptions = {},
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResult<RawInvokeReceipt>> {
    const transactionOptions = this.getTransactionOptions(options);
    const { from, attributes } = transactionOptions;

    const contractID: UserAccountID = {
      address: contract,
      network: from.network,
    };

    const params = paramsIn.concat([common.stringToUInt160(addressToScriptHash(transfer.to))]);

    return this.invokeRaw({
      invokeMethodOptionsOrScript: {
        contract,
        invokeMethod: method,
        params,
      },
      options: {
        ...transactionOptions,
        attributes: attributes.concat(this.getInvokeAttributes(contract, method, paramsZipped, false, from.address)),
      },
      // TODO: fix onConfirm
      onConfirm: ({ receipt, data }): RawInvokeReceipt => ({
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        blockTime: receipt.blockTime,
        transactionIndex: receipt.transactionIndex,
        transactionHash: receipt.transactionHash,
        globalIndex: receipt.globalIndex,
        confirmations: receipt.confirmations,
        result: data.result,
        actions: data.actions,
      }),
      witnesses: this.getInvokeScripts(method, params, true),
      transfers: [
        {
          ...transfer,
          to: contract,
          from: contractID,
        },
      ],
      method: 'invokeSend',
      labels: {
        [Labels.INVOKE_METHOD]: method,
      },
      sourceMaps,
    });
  }

  // TODO: finalize after compiler (need to open issue)
  public async invokeCompleteSend(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    hash: Hash256String,
    options: TransactionOptions = {},
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResult<RawInvokeReceipt>> {
    const transactionOptions = this.getTransactionOptions(options);
    const { from, attributes } = transactionOptions;

    const sendTransaction = await this.provider.getTransaction(from.network, hash);

    return this.invokeRaw({
      invokeMethodOptionsOrScript: {
        contract,
        invokeMethod: method,
        params,
      },
      options: {
        ...transactionOptions,
        attributes: attributes.concat(this.getInvokeAttributes(contract, method, paramsZipped, false, from.address)),
      },
      // TODO: fix onConfirm
      onConfirm: ({ receipt, data }): RawInvokeReceipt => ({
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        blockTime: receipt.blockTime,
        transactionIndex: receipt.transactionIndex,
        transactionHash: receipt.transactionHash,
        globalIndex: receipt.globalIndex,
        confirmations: receipt.confirmations,
        result: data.result,
        actions: data.actions,
      }),
      witnesses: this.getInvokeScripts(method, params, true),
      method: 'invokeCompleteSend',
      labels: {
        [Labels.INVOKE_METHOD]: method,
      },
      sourceMaps,
    });
  }

  // TODO: finalize after compiler (need to open issue)
  public async invokeRefundAssets(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    hash: Hash256String,
    options: TransactionOptions = {},
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResult<RawInvokeReceipt>> {
    const transactionOptions = this.getTransactionOptions(options);
    const { from, attributes } = transactionOptions;

    const refundTransaction = await this.provider.getTransaction(from.network, hash);

    return this.invokeRaw({
      invokeMethodOptionsOrScript: {
        contract,
        invokeMethod: method,
        params,
      },
      options: {
        ...transactionOptions,
        attributes: attributes.concat(this.getInvokeAttributes(contract, method, paramsZipped, false, from.address)),
      },
      // TODO: fix onConfirm
      onConfirm: ({ receipt, data }): RawInvokeReceipt => ({
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        blockTime: receipt.blockTime,
        transactionIndex: receipt.transactionIndex,
        transactionHash: receipt.transactionHash,
        globalIndex: receipt.globalIndex,
        confirmations: receipt.confirmations,
        result: data.result,
        actions: data.actions,
      }),
      witnesses: this.getInvokeScripts(method, params, true),
      method: 'invokeRefundAssets',
      labels: {
        [Labels.INVOKE_METHOD]: method,
      },
      sourceMaps,
    });
  }

  public async invokeClaim(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    options: TransactionOptions = {},
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResult> {
    const { from, attributes } = this.getTransactionOptions(options);

    return this.capture(
      async () => {
        const unclaimedAmount = await this.provider.getUnclaimed(from.network, contract);

        if (unclaimedAmount.lte(new BigNumber(0))) {
          throw new NothingToClaimError(from);
        }

        return this.executeInvokeClaim({
          contract,
          unclaimedAmount,
          attributes,
          from,
          method,
          params,
          paramsZipped,
          sourceMaps,
        });
      },
      {
        name: 'neo_invoke_claim',
      },
    );
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
    const callReceipt = await this.provider.testTransaction(network, transaction);
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
      validBlockCount = TransactionModel.maxValidBlockIncrement - 1,
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
    // TODO: what kind of sorting needs to be done with the existing witnesses?
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

  protected abstract async executeInvokeClaim(options: ExecuteInvokeClaimOptions): Promise<TransactionResult>;

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
    verify = true,
    witnesses = [],
    labels = {},
    sourceMaps,
    networkFee,
  }: InvokeRawOptions<T>) {
    const { from, attributes: attributesIn } = this.getTransactionOptions(options);
    const { script, invokeMethodOptions } = this.getScriptAndInvokeMethodOptions(invokeMethodOptionsOrScript);

    return this.capture(
      async () => {
        const { gas: systemFee, attributes } = await this.getSystemFee({
          script,
          network: from.network,
          attributes: attributesIn,
          witnesses,
        });

        // TODO: do we need to use networkFee.plus(gas)?
        // where does network fee come in? Note that Spencer just added "networkFee" in here. see how it was used before
        // Need to finalize executeInvoke method in LUAP first to know what needs to be passed in here
        // and ultimately what needs to be passed into invokeRaw

        return invokeMethodOptions === undefined
          ? this.executeInvokeScript({
              script,
              from,
              attributes,
              systemFee,
              networkFee,
              verify,
              witnesses,
              onConfirm,
              sourceMaps,
            })
          : this.executeInvokeMethod({
              script,
              invokeMethodOptions,
              from,
              attributes,
              systemFee,
              networkFee,
              verify,
              witnesses,
              onConfirm,
              sourceMaps,
            });
      },
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

  private getScriptAndInvokeMethodOptions(
    invokeMethodOptionsOrScript: InvokeMethodOptions | Buffer,
  ): { readonly script: Buffer; readonly invokeMethodOptions: InvokeMethodOptions | undefined } {
    let script: Buffer;
    let invokeMethodOptions: InvokeMethodOptions | undefined;
    if (invokeMethodOptionsOrScript instanceof Buffer) {
      script = invokeMethodOptionsOrScript;
    } else {
      invokeMethodOptions = invokeMethodOptionsOrScript;
      const { contract, invokeMethod, params } = invokeMethodOptions;
      script = clientUtils.getInvokeMethodScript({
        address: contract,
        method: invokeMethod,
        params,
      });
    }

    return { script, invokeMethodOptions };
  }
}
