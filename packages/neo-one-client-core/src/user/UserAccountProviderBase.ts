import {
  Account,
  AddressString,
  addressToScriptHash,
  Attribute,
  AttributeModel,
  AttributeUsageModel,
  Block,
  ClaimTransaction,
  common,
  ContractTransaction,
  ForwardValue,
  GetOptions,
  Hash256String,
  Input,
  InputModel,
  InputOutput,
  InvocationTransaction,
  InvocationTransactionModel,
  InvokeSendUnsafeReceiveTransactionOptions,
  IterOptions,
  NetworkType,
  Output,
  OutputModel,
  Param,
  ParamJSON,
  RawAction,
  RawCallReceipt,
  RawInvocationData,
  RawInvokeReceipt,
  ScriptBuilderParam,
  SourceMaps,
  Transaction,
  TransactionBaseModel,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UInt160AttributeModel,
  UserAccount,
  UserAccountID,
  utils,
  Witness,
  WitnessModel,
} from '@neo-one/client-common';
import {
  AggregationType,
  globalStats,
  Measure,
  MeasureUnit,
  processActionsAndMessage,
  TagMap,
} from '@neo-one/client-switch';
import { Labels, labelToTag, utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import debug from 'debug';
import _ from 'lodash';
import { Observable } from 'rxjs';
import { clientUtils } from '../clientUtils';
import {
  FundsInUseError,
  InsufficientFundsError,
  InsufficientSystemFeeError,
  InvalidTransactionError,
  InvokeError,
  NoAccountError,
  NothingToClaimError,
  NothingToRefundError,
  NothingToSendError,
  NotImplementedError,
} from '../errors';
import { converters } from './converters';

const logger = debug('NEOONE:LocalUserAccountProvider');
const invokeTag = labelToTag(Labels.INVOKE_RAW_METHOD);

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
  readonly onConfirm: (options: {
    readonly transaction: Transaction;
    readonly data: RawInvocationData;
    readonly receipt: TransactionReceipt;
  }) => Promise<T> | T;
  readonly method: string;
  readonly scripts?: readonly WitnessModel[];
  readonly labels?: Record<string, string>;
  readonly rawInputs?: readonly Input[];
  readonly rawOutputs?: readonly Output[];
  readonly sourceMaps?: SourceMaps;
  readonly reorderOutputs?: (outputs: readonly Output[]) => readonly Output[];
}

export interface ExecuteInvokeScriptOptions<T extends TransactionReceipt> {
  readonly script: Buffer;
  readonly from: UserAccountID;
  readonly attributes: readonly Attribute[];
  readonly inputs: readonly InputOutput[];
  readonly outputs: readonly Output[];
  readonly rawInputs: readonly Input[];
  readonly rawOutputs: readonly Output[];
  readonly gas: BigNumber;
  readonly scripts: readonly WitnessModel[];
  readonly verify: boolean;
  readonly reorderOutputs: (outputs: readonly Output[]) => readonly Output[];
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
  readonly inputs: readonly InputOutput[];
  readonly outputs: readonly Output[];
  readonly unclaimed: readonly Input[];
  readonly amount: BigNumber;
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
  readonly getUnclaimed: (
    network: NetworkType,
    address: AddressString,
  ) => Promise<{ readonly unclaimed: readonly Input[]; readonly amount: BigNumber }>;
  readonly getUnspentOutputs: (network: NetworkType, address: AddressString) => Promise<readonly InputOutput[]>;
  readonly getTransactionReceipt: (
    network: NetworkType,
    hash: Hash256String,
    options?: GetOptions,
  ) => Promise<TransactionReceipt>;
  readonly getInvocationData: (network: NetworkType, hash: Hash256String) => Promise<RawInvocationData>;
  readonly testInvoke: (network: NetworkType, transaction: string) => Promise<RawCallReceipt>;
  readonly call: (
    network: NetworkType,
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
  ) => Promise<RawCallReceipt>;
  readonly getBlockCount: (network: NetworkType) => Promise<number>;
  readonly getTransaction: (network: NetworkType, hash: Hash256String) => Promise<Transaction>;
  readonly getOutput: (network: NetworkType, input: Input) => Promise<Output>;
  readonly iterBlocks: (network: NetworkType, options?: IterOptions) => AsyncIterable<Block>;
  readonly getAccount: (network: NetworkType, address: AddressString) => Promise<Account>;
  readonly iterActionsRaw?: (network: NetworkType, options?: IterOptions) => AsyncIterable<RawAction>;
}

interface TransactionOptionsFull {
  readonly from: UserAccountID;
  readonly attributes: readonly Attribute[];
  readonly networkFee: BigNumber;
  readonly systemFee: BigNumber;
}

const NEO_ONE_ATTRIBUTE: Attribute = {
  usage: 'Remark15',
  data: Buffer.from('neo-one', 'utf8').toString('hex'),
};

const transferDurationSec = globalStats.createMeasureDouble('transfer/duration', MeasureUnit.SEC);
const transferFailures = globalStats.createMeasureInt64('transfer/failures', MeasureUnit.UNIT);
const claimDurationSec = globalStats.createMeasureDouble('claim/duration', MeasureUnit.SEC);
const claimFailures = globalStats.createMeasureInt64('claim/failures', MeasureUnit.UNIT);
const invokeDurationSec = globalStats.createMeasureDouble('invoke/duration', MeasureUnit.SEC);
const invokeFailures = globalStats.createMeasureInt64('invoke/failures', MeasureUnit.UNIT);

const NEO_TRANSFER_DURATION_SECONDS = globalStats.createView(
  'neo_transfer_duration_seconds',
  transferDurationSec,
  AggregationType.DISTRIBUTION,
  [],
  'transfer durations in seconds',
  [1, 2, 5, 7.5, 10, 12.5, 15, 17.5, 20],
);
globalStats.registerView(NEO_TRANSFER_DURATION_SECONDS);

const NEO_TRANSFER_FAILURES_TOTAL = globalStats.createView(
  'neo_transfer_failures_total',
  transferFailures,
  AggregationType.COUNT,
  [],
  'total transfer failures',
);
globalStats.registerView(NEO_TRANSFER_FAILURES_TOTAL);

const NEO_CLAIM_DURATION_SECONDS = globalStats.createView(
  'neo_claim_duration_seconds',
  claimDurationSec,
  AggregationType.DISTRIBUTION,
  [],
  'claim durations in seconds',
  [1, 2, 5, 7.5, 10, 12.5, 15, 17.5, 20],
);
globalStats.registerView(NEO_CLAIM_DURATION_SECONDS);

const NEO_CLAIM_FAILURES_TOTAL = globalStats.createView(
  'neo_claims_failures_total',
  claimFailures,
  AggregationType.COUNT,
  [],
  'total claims failures',
);
globalStats.registerView(NEO_CLAIM_FAILURES_TOTAL);

const NEO_INVOKE_RAW_DURATION_SECONDS = globalStats.createView(
  'neo_invoke_raw_duration_seconds',
  invokeDurationSec,
  AggregationType.DISTRIBUTION,
  [invokeTag],
  'invoke durations in seconds',
  [1, 2, 5, 7.5, 10, 12.5, 15, 17.5, 20],
);
globalStats.registerView(NEO_INVOKE_RAW_DURATION_SECONDS);

const NEO_INVOKE_RAW_FAILURES_TOTAL = globalStats.createView(
  'neo_invoke_raw_failures_total',
  invokeFailures,
  AggregationType.COUNT,
  [invokeTag],
  'total invocation failures',
);
globalStats.registerView(NEO_INVOKE_RAW_FAILURES_TOTAL);

interface FullTransfer extends Transfer {
  readonly from: UserAccountID;
}

export abstract class UserAccountProviderBase<TProvider extends Provider> {
  public readonly provider: TProvider;
  public readonly iterActionsRaw?: (network: NetworkType, options?: IterOptions) => AsyncIterable<RawAction>;
  protected readonly mutableUsedOutputs: Set<string>;
  protected mutableBlockCount: number;

  public constructor({ provider }: { readonly provider: TProvider }) {
    this.provider = provider;

    this.mutableBlockCount = 0;
    this.mutableUsedOutputs = new Set<string>();

    const iterActionsRaw = this.provider.iterActionsRaw;
    if (iterActionsRaw !== undefined) {
      this.iterActionsRaw = iterActionsRaw.bind(this.provider);
    }
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

  public async transfer(
    transfers: readonly Transfer[],
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt, InvocationTransaction | ContractTransaction>> {
    const { from, attributes, networkFee } = this.getTransactionOptions(options);

    return this.capture(async () => this.executeTransfer(transfers, from, attributes, networkFee), {
      title: 'neo_transfer',
      measures: {
        total: transferDurationSec,
        error: transferFailures,
      },
    });
  }

  public async claim(options?: TransactionOptions): Promise<TransactionResult<TransactionReceipt, ClaimTransaction>> {
    const { from, attributes, networkFee } = this.getTransactionOptions(options);

    return this.capture(async () => this.executeClaim(from, attributes, networkFee), {
      title: 'neo_claim',
      measures: {
        total: claimDurationSec,
        error: claimFailures,
      },
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
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
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
        transactionIndex: receipt.transactionIndex,
        globalIndex: receipt.globalIndex,
        result: data.result,
        actions: data.actions,
      }),
      scripts: this.getInvokeScripts(
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

  public async invokeSend(
    contract: AddressString,
    method: string,
    paramsIn: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    transfer: Transfer,
    options: TransactionOptions = {},
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
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
      onConfirm: ({ receipt, data }): RawInvokeReceipt => ({
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.transactionIndex,
        globalIndex: receipt.globalIndex,
        result: data.result,
        actions: data.actions,
      }),
      scripts: this.getInvokeScripts(method, params, true),
      transfers: [
        {
          ...transfer,
          to: contract,
          from: contractID,
        },
      ],
      reorderOutputs: (outputs) => {
        const output = outputs.find(({ value }) => value.isEqualTo(transfer.amount));
        if (output === undefined) {
          throw new Error('Something went wrong.');
        }
        const outputIdx = outputs.indexOf(output);
        if (outputIdx === -1) {
          throw new Error('Something went wrong.');
        }

        return [outputs[outputIdx]].concat(outputs.slice(0, outputIdx)).concat(outputs.slice(outputIdx + 1));
      },
      method: 'invokeSend',
      labels: {
        [Labels.INVOKE_METHOD]: method,
      },
      sourceMaps,
    });
  }

  public async invokeCompleteSend(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    hash: Hash256String,
    options: TransactionOptions = {},
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    const transactionOptions = this.getTransactionOptions(options);
    const { from, attributes } = transactionOptions;

    const sendTransaction = await this.provider.getTransaction(from.network, hash);
    if (sendTransaction.outputs.length === 0) {
      throw new NothingToSendError();
    }
    const sendInput = { hash, index: 0 };
    const sendOutput = {
      ...sendTransaction.outputs[0],
      address: from.address,
    };

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
      onConfirm: ({ receipt, data }): RawInvokeReceipt => ({
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.transactionIndex,
        globalIndex: receipt.globalIndex,
        result: data.result,
        actions: data.actions,
      }),
      scripts: this.getInvokeScripts(method, params, true),
      rawInputs: [sendInput],
      rawOutputs: [sendOutput],
      method: 'invokeCompleteSend',
      labels: {
        [Labels.INVOKE_METHOD]: method,
      },
      sourceMaps,
    });
  }

  public async invokeRefundAssets(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    hash: Hash256String,
    options: TransactionOptions = {},
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    const transactionOptions = this.getTransactionOptions(options);
    const { from, attributes } = transactionOptions;

    const refundTransaction = await this.provider.getTransaction(from.network, hash);
    const refundOutputs = refundTransaction.outputs
      .map((output, idx) => ({ output, idx }))
      .filter(({ output }) => output.address === contract);
    const inputs = refundOutputs.map(({ idx }) => ({ hash, index: idx }));
    const outputs = Object.entries(_.groupBy(refundOutputs.map(({ output }) => output), (output) => output.asset)).map(
      ([asset, assetOutputs]) => ({
        address: from.address,
        asset,
        value: assetOutputs.reduce((acc, output) => acc.plus(output.value), new BigNumber('0')),
      }),
    );

    if (inputs.length === 0) {
      throw new NothingToRefundError();
    }

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
      onConfirm: ({ receipt, data }): RawInvokeReceipt => ({
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.transactionIndex,
        globalIndex: receipt.globalIndex,
        result: data.result,
        actions: data.actions,
      }),
      scripts: this.getInvokeScripts(method, params, true),
      rawInputs: inputs,
      rawOutputs: outputs,
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
  ): Promise<TransactionResult<TransactionReceipt, ClaimTransaction>> {
    const { from, attributes, networkFee } = this.getTransactionOptions(options);

    return this.capture(
      async () => {
        const [{ unclaimed, amount }, { inputs, outputs }] = await Promise.all([
          this.provider.getUnclaimed(from.network, contract),
          this.getTransfersInputOutputs({
            from,
            gas: networkFee,
            transfers: [],
          }),
        ]);

        if (unclaimed.length === 0) {
          throw new NothingToClaimError(from);
        }

        return this.executeInvokeClaim({
          contract,
          inputs,
          outputs,
          unclaimed,
          amount,
          attributes,
          from,
          method,
          params,
          paramsZipped,
          sourceMaps,
        });
      },
      {
        title: 'neo_invoke_claim',
        measures: {
          total: claimDurationSec,
          error: claimFailures,
        },
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

  protected getTransactionOptions(options: TransactionOptions = {}): TransactionOptionsFull {
    const { attributes = [], networkFee = utils.ZERO_BIG_NUMBER, systemFee = utils.ZERO_BIG_NUMBER } = options;

    const { from: fromIn } = options;
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
      attributes: attributes.concat([NEO_ONE_ATTRIBUTE]),
      networkFee,
      systemFee,
    };
  }

  protected getInvokeAttributes(
    contract: AddressString,
    method: string,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    verify: boolean,
    from?: AddressString,
  ): readonly Attribute[] {
    return [
      {
        usage: 'Remark14',
        data: Buffer.from(
          `neo-one-invoke:${this.getInvokeAttributeTag(contract, method, paramsZipped)}`,
          'utf8',
        ).toString('hex'),
      },
      verify
        ? ({
            usage: 'Script',
            data: contract,
            // tslint:disable-next-line no-any
          } as any)
        : undefined,
      from === undefined
        ? undefined
        : ({
            usage: 'Script',
            data: from,
            // tslint:disable-next-line no-any
          } as any),
    ].filter(commonUtils.notNull);
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

  protected async consolidate({
    inputs,
    transactionUnsignedIn,
    from,
    byteLimit,
  }: {
    readonly transactionUnsignedIn: TransactionBaseModel;
    readonly inputs: readonly InputOutput[];
    readonly from: UserAccountID;
    readonly byteLimit: number;
  }): Promise<TransactionBaseModel> {
    const messageSize = transactionUnsignedIn.serializeUnsigned().length;

    const getMessageSize = ({
      numNewInputs,
      numNewOutputs = 0,
    }: {
      readonly numNewInputs: number;
      readonly numNewOutputs?: number;
    }): number => messageSize + numNewInputs * InputModel.size + numNewOutputs * OutputModel.size;

    const { unspentOutputs: consolidatableUnspents } = await this.getUnspentOutputs({ from });
    const assetToInputOutputsUnsorted = consolidatableUnspents
      .filter((unspent) => !inputs.some((input) => unspent.hash === input.hash && unspent.index === input.index))
      .reduce<{ [key: string]: readonly InputOutput[] }>((acc, unspent) => {
        if ((acc[unspent.asset] as readonly InputOutput[] | undefined) !== undefined) {
          return {
            ...acc,
            [unspent.asset]: acc[unspent.asset].concat([unspent]),
          };
        }

        return {
          ...acc,
          [unspent.asset]: [unspent],
        };
      }, {});

    const assetToInputOutputs = Object.entries(assetToInputOutputsUnsorted).reduce(
      (acc: typeof assetToInputOutputsUnsorted, [_asset, outputs]) => ({
        ...acc,
        [_asset]: outputs.slice().sort((coinA, coinB) => coinA.value.comparedTo(coinB.value)),
      }),
      assetToInputOutputsUnsorted,
    );

    const { newInputs, updatedOutputs, remainingAssetToInputOutputs } = transactionUnsignedIn.outputs.reduce(
      (
        acc: {
          readonly newInputs: readonly InputModel[];
          readonly updatedOutputs: readonly OutputModel[];
          readonly remainingAssetToInputOutputs: typeof assetToInputOutputs;
        },
        output,
      ) => {
        const asset = common.uInt256ToString(output.asset);

        const unspentOutputsIn = acc.remainingAssetToInputOutputs[asset] as readonly InputOutput[] | undefined;

        const unspentOutputs =
          unspentOutputsIn === undefined || common.uInt160ToString(output.address) !== addressToScriptHash(from.address)
            ? []
            : acc.remainingAssetToInputOutputs[asset];

        const tempIns = unspentOutputs.slice(
          0,
          Math.max(
            Math.floor((byteLimit - getMessageSize({ numNewInputs: acc.newInputs.length })) / InputModel.size),
            0,
          ),
        );

        return {
          newInputs: acc.newInputs.concat(this.convertInputs(tempIns)),
          updatedOutputs: acc.updatedOutputs.concat([
            output.clone({
              value: output.value.add(
                utils.bigNumberToBN(tempIns.reduce((left, right) => left.plus(right.value), new BigNumber('0')), 8),
              ),
            }),
          ]),

          remainingAssetToInputOutputs:
            unspentOutputsIn === undefined
              ? acc.remainingAssetToInputOutputs
              : {
                  ...acc.remainingAssetToInputOutputs,
                  [asset]: unspentOutputsIn.slice(tempIns.length),
                },
        };
      },
      {
        newInputs: [],
        updatedOutputs: [],
        remainingAssetToInputOutputs: assetToInputOutputs,
      },
    );

    const { finalInputs, newOutputs } = _.sortBy(
      // tslint:disable-next-line no-unused
      Object.entries(remainingAssetToInputOutputs).filter(([_asset, outputs]) => outputs.length >= 2),
      ([asset]) => {
        if (asset === common.NEO_ASSET_HASH) {
          return 0;
        }

        if (asset === common.GAS_ASSET_HASH) {
          return 1;
        }

        return 2;
      },
    ).reduce(
      (
        acc: {
          readonly finalInputs: readonly InputModel[];
          readonly newOutputs: readonly OutputModel[];
        },
        [asset, outputs],
      ) => {
        const newUnspents = outputs.slice(
          0,
          Math.max(
            0,
            Math.floor(
              (byteLimit -
                getMessageSize({ numNewInputs: acc.finalInputs.length, numNewOutputs: acc.newOutputs.length }) -
                OutputModel.size) /
                InputModel.size,
            ),
          ),
        );

        return {
          finalInputs: acc.finalInputs.concat(this.convertInputs(newUnspents)),
          newOutputs:
            newUnspents.length === 0
              ? acc.newOutputs
              : acc.newOutputs.concat(
                  this.convertOutputs([
                    {
                      asset,
                      value: newUnspents.reduce((left, right) => left.plus(right.value), new BigNumber('0')),
                      address: from.address,
                    },
                  ]),
                ),
        };
      },
      { finalInputs: newInputs, newOutputs: [] },
    );

    return transactionUnsignedIn.clone({
      inputs: transactionUnsignedIn.inputs.concat(finalInputs),
      outputs: updatedOutputs.concat(newOutputs),
    });
  }

  /*
      This function returns one of two options:
        1. For invocations -> 2 witnesses
        2. All else -> 1 witness
      We do some basic verification to make sure our assumptions at this point are
      correct, that is:
        - If we have 2 script attributes:
          - 1 of them is = to scriptHash
          - We have 1 witness
        - If we have 1 script attribute and it is = to script hash
          - We have 0 witness
        - If we have 1 script attribute and it is != to script hash
          - We have 1 witness
    */
  protected addWitness({
    transaction,
    inputOutputs,
    address,
    witness,
  }: {
    readonly transaction: TransactionBaseModel;
    readonly inputOutputs: readonly Output[];
    readonly address: AddressString;
    readonly witness: WitnessModel;
  }): TransactionBaseModel {
    const scriptAttributes = transaction.attributes.filter(
      (attribute): attribute is UInt160AttributeModel => attribute.usage === AttributeUsageModel.Script,
    );
    const scriptHash = addressToScriptHash(address);
    const scriptHashes = [
      ...new Set(
        inputOutputs
          .map((inputOutput) => addressToScriptHash(inputOutput.address))
          .concat(scriptAttributes.map((attribute) => common.uInt160ToString(attribute.value))),
      ),
    ].filter((otherHash) => otherHash !== scriptHash);

    if (scriptHashes.length === 1) {
      if (transaction.scripts.length !== 1) {
        throw new InvalidTransactionError('Something went wrong! Expected 1 script.');
      }

      const otherHash = scriptHashes[0];
      const otherScript = transaction.scripts[0];

      return transaction.clone({
        scripts: _.sortBy<[string, WitnessModel]>(
          [[scriptHash, witness], [otherHash, otherScript]],
          [(value: [string, WitnessModel]) => value[0]],
        ).map((value) => value[1]),
      });
    }

    if (scriptHashes.length === 0) {
      if (transaction.scripts.length !== 0) {
        throw new InvalidTransactionError('Something went wrong! Expected 0 scripts.');
      }

      return transaction.clone({ scripts: [witness] });
    }

    throw new InvalidTransactionError('Something went wrong!');
  }

  protected async getUnspentOutputs({
    from,
  }: {
    readonly from: UserAccountID;
  }): Promise<{ readonly unspentOutputs: readonly InputOutput[]; readonly wasFiltered: boolean }> {
    const [newBlockCount, allUnspentsIn] = await Promise.all([
      this.provider.getBlockCount(from.network),
      this.provider.getUnspentOutputs(from.network, from.address),
    ]);
    if (newBlockCount !== this.mutableBlockCount) {
      this.mutableUsedOutputs.clear();
      this.mutableBlockCount = newBlockCount;
    }
    const unspentOutputs = allUnspentsIn.filter(
      (unspent) => !this.mutableUsedOutputs.has(`${unspent.hash}:${unspent.index}`),
    );
    const wasFiltered = allUnspentsIn.length !== unspentOutputs.length;

    return { unspentOutputs, wasFiltered };
  }

  protected async getTransfersInputOutputs({
    transfers,
    from,
    gas,
  }: {
    readonly transfers: readonly FullTransfer[];
    readonly from: UserAccountID;
    readonly gas: BigNumber;
  }): Promise<{ readonly outputs: readonly Output[]; readonly inputs: readonly InputOutput[] }> {
    if (transfers.length === 0 && gas.lte(utils.ZERO_BIG_NUMBER)) {
      return { inputs: [], outputs: [] };
    }

    const mutableGroupedTransfers = _.groupBy(transfers, ({ from: transferFrom }) => transferFrom.address);
    if (gas.isGreaterThan(utils.ZERO_BIG_NUMBER)) {
      const fromTransfers = mutableGroupedTransfers[from.address] as readonly FullTransfer[] | undefined;
      const newTransfer: FullTransfer = {
        from,
        amount: gas,
        asset: common.GAS_ASSET_HASH,
        // tslint:disable-next-line no-any
      } as any;
      mutableGroupedTransfers[from.address] =
        fromTransfers === undefined ? [newTransfer] : fromTransfers.concat([newTransfer]);
    }

    const results = await Promise.all(
      Object.values(mutableGroupedTransfers).map(async (transfersFrom) =>
        this.getTransfersInputOutputsFrom({
          transfers: transfersFrom,
          from: transfersFrom[0].from,
        }),
      ),
    );

    return results.reduce(
      (acc, { outputs, inputs }) => ({
        outputs: acc.outputs.concat(outputs),
        inputs: acc.inputs.concat(inputs),
      }),
      { outputs: [], inputs: [] },
    );
  }

  protected async getTransfersInputOutputsFrom({
    transfers,
    from,
  }: {
    readonly transfers: readonly Transfer[];
    readonly from: UserAccountID;
  }): Promise<{ readonly outputs: readonly Output[]; readonly inputs: readonly InputOutput[] }> {
    const { unspentOutputs: allOutputs, wasFiltered } = await this.getUnspentOutputs({ from });

    return Object.values(_.groupBy(transfers, ({ asset }) => asset)).reduce(
      (acc, toByAsset) => {
        const { asset } = toByAsset[0];
        const assetResults = toByAsset.reduce<{
          remaining: BigNumber;
          remainingOutputs: readonly InputOutput[];
          inputs: readonly InputOutput[];
          outputs: readonly Output[];
        }>(
          ({ remaining, remainingOutputs, inputs, outputs: innerOutputs }, { amount, to }) => {
            const result = this.getTransferInputOutputs({
              from: from.address,
              to,
              asset,
              amount,
              remainingOutputs,
              remaining,
              wasFiltered,
            });

            return {
              remaining: result.remaining,
              remainingOutputs: result.remainingOutputs,
              inputs: inputs.concat(result.inputs),
              outputs: innerOutputs.concat(result.outputs),
            };
          },
          {
            remaining: utils.ZERO_BIG_NUMBER,
            remainingOutputs: allOutputs.filter((output) => output.asset === asset),
            inputs: [],
            outputs: [],
          },
        );

        let outputs = acc.outputs.concat(assetResults.outputs);
        if (assetResults.remaining.gt(utils.ZERO_BIG_NUMBER)) {
          outputs = outputs.concat([
            {
              address: from.address,
              asset,
              value: assetResults.remaining,
            },
          ]);
        }

        return {
          inputs: acc.inputs.concat(assetResults.inputs),
          outputs,
        };
      },
      { inputs: [] as ReadonlyArray<InputOutput>, outputs: [] as ReadonlyArray<Output> },
    );
  }

  protected getTransferInputOutputs({
    to,
    amount: originalAmount,
    asset,
    remainingOutputs,
    remaining,
    wasFiltered,
  }: {
    readonly from: AddressString;
    readonly to?: AddressString;
    readonly amount: BigNumber;
    readonly asset: Hash256String;
    readonly remainingOutputs: readonly InputOutput[];
    readonly remaining: BigNumber;
    readonly wasFiltered: boolean;
  }): {
    readonly inputs: readonly InputOutput[];
    readonly outputs: readonly Output[];
    readonly remainingOutputs: readonly InputOutput[];
    readonly remaining: BigNumber;
  } {
    const amount = originalAmount.minus(remaining);

    const outputs: ReadonlyArray<Output> =
      to === undefined
        ? []
        : [
            {
              address: to,
              asset,
              value: originalAmount,
            },
          ];

    if (amount.lte(utils.ZERO_BIG_NUMBER)) {
      return {
        inputs: [],
        outputs,
        remainingOutputs,
        remaining: remaining.minus(originalAmount),
      };
    }

    const outputsOrdered = remainingOutputs.slice().sort((coinA, coinB) => coinA.value.comparedTo(coinB.value) * -1);

    const sum = outputsOrdered.reduce<BigNumber>((acc, coin) => acc.plus(coin.value), utils.ZERO_BIG_NUMBER);

    if (sum.lt(amount)) {
      if (wasFiltered) {
        throw new FundsInUseError(sum, amount, this.mutableUsedOutputs.size);
      }
      throw new InsufficientFundsError(sum, amount);
    }

    // find input coins
    let k = 0;
    let amountRemaining = amount.plus(utils.ZERO_BIG_NUMBER);
    // tslint:disable-next-line no-loop-statement
    while (outputsOrdered[k].value.lte(amountRemaining)) {
      amountRemaining = amountRemaining.minus(outputsOrdered[k].value);
      if (amountRemaining.isEqualTo(utils.ZERO_BIG_NUMBER)) {
        break;
      }
      k += 1;
    }

    let coinAmount = utils.ZERO_BIG_NUMBER;
    const mutableInputs: InputOutput[] = [];
    // tslint:disable-next-line no-loop-statement
    for (let i = 0; i < k + 1; i += 1) {
      coinAmount = coinAmount.plus(outputsOrdered[i].value);
      mutableInputs.push(outputsOrdered[i]);
    }

    return {
      inputs: mutableInputs,
      outputs,
      remainingOutputs: outputsOrdered.slice(k + 1),
      remaining: coinAmount.minus(amount),
    };
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

  protected convertInputs(inputs: readonly Input[]): readonly InputModel[] {
    return inputs.map((input) => converters.input(input));
  }

  protected convertOutputs(outputs: readonly Output[]): readonly OutputModel[] {
    return outputs.map((output) => converters.output(output));
  }

  protected convertWitness(script: Witness): WitnessModel {
    return converters.witness(script);
  }

  protected async capture<T>(
    func: () => Promise<T>,
    {
      title,
      labels = {},
      measures,
      invoke = false,
    }: {
      readonly title: string;
      readonly labels?: Record<string, string>;
      readonly measures?: {
        readonly total?: Measure;
        readonly error?: Measure;
      };
      readonly invoke?: boolean;
    },
  ): Promise<T> {
    const tags = new TagMap();
    if (invoke) {
      const value = labels[Labels.INVOKE_RAW_METHOD];
      // tslint:disable-next-line: strict-type-predicates
      if (value === undefined) {
        throw new Error('invocation should have a invoke method');
      }
      tags.set(invokeTag, { value });
    }

    const startTime = Date.now();
    try {
      const result = await func();
      logger('%o', { title, level: 'verbose', ...labels });
      if (measures !== undefined && measures.total !== undefined) {
        globalStats.record(
          [
            {
              measure: measures.total,
              value: Date.now() - startTime,
            },
          ],
          tags,
        );
      }

      return result;
    } catch (error) {
      logger('%o', { title, level: 'error', error: error.message, ...labels });
      if (measures !== undefined && measures.error !== undefined) {
        globalStats.record(
          [
            {
              measure: measures.error,
              value: 1,
            },
          ],
          tags,
        );
      }

      throw error;
    }
  }

  protected async checkSystemFees({
    script,
    transfers = [],
    from,
    networkFee,
    systemFee,
    attributes: attributesIn = [],
    rawInputs = [],
    rawOutputs = [],
    scripts = [],
    sourceMaps,
    reorderOutputs = (outputs) => outputs,
  }: {
    readonly script: Buffer;
    readonly transfers?: ReadonlyArray<FullTransfer>;
    readonly from: UserAccountID;
    readonly networkFee: BigNumber;
    readonly systemFee: BigNumber;
    readonly attributes?: ReadonlyArray<Attribute>;
    readonly rawInputs?: ReadonlyArray<Input>;
    readonly rawOutputs?: ReadonlyArray<Output>;
    readonly scripts?: ReadonlyArray<WitnessModel>;
    readonly sourceMaps?: SourceMaps;
    readonly reorderOutputs?: (outputs: ReadonlyArray<Output>) => ReadonlyArray<Output>;
  }): Promise<{
    readonly gas: BigNumber;
    readonly attributes: ReadonlyArray<Attribute>;
  }> {
    const { inputs: testInputs, outputs: testOutputs } = await this.getTransfersInputOutputs({
      transfers,
      from,
      gas: networkFee,
    });

    const attributes = attributesIn.concat({
      usage: 'Remark15',
      data: Buffer.from(`${utils.randomUInt()}`, 'utf8').toString('hex'),
    });

    const testTransaction = new InvocationTransactionModel({
      version: 1,
      inputs: this.convertInputs(rawInputs.concat(testInputs)),
      outputs: this.convertOutputs(reorderOutputs(rawOutputs.concat(testOutputs))),
      attributes: this.convertAttributes(attributes),
      gas: common.TEN_THOUSAND_FIXED8,
      script,
      scripts,
    });

    const callReceipt = await this.provider.testInvoke(from.network, testTransaction.serializeWire().toString('hex'));

    if (callReceipt.result.state === 'FAULT') {
      const message = await processActionsAndMessage({
        actions: callReceipt.actions,
        message: callReceipt.result.message,
        sourceMaps,
      });
      throw new InvokeError(message);
    }

    const gas = callReceipt.result.gasConsumed.integerValue(BigNumber.ROUND_UP);
    if (gas.gt(utils.ZERO_BIG_NUMBER) && systemFee.lt(gas) && !systemFee.eq(utils.NEGATIVE_ONE_BIG_NUMBER)) {
      throw new InsufficientSystemFeeError(systemFee, gas);
    }

    return { gas, attributes };
  }

  protected abstract async executeInvokeMethod<T extends TransactionReceipt>(
    options: ExecuteInvokeMethodOptions<T>,
  ): Promise<TransactionResult<T, InvocationTransaction>>;

  protected abstract async executeInvokeScript<T extends TransactionReceipt>(
    options: ExecuteInvokeScriptOptions<T>,
  ): Promise<TransactionResult<T, InvocationTransaction>>;

  protected abstract async executeInvokeClaim(
    options: ExecuteInvokeClaimOptions,
  ): Promise<TransactionResult<TransactionReceipt, ClaimTransaction>>;

  protected abstract async executeTransfer(
    transfers: readonly Transfer[],
    from: UserAccountID,
    attributes: readonly Attribute[],
    networkFee: BigNumber,
  ): Promise<TransactionResult<TransactionReceipt, InvocationTransaction | ContractTransaction>>;

  protected abstract async executeClaim(
    from: UserAccountID,
    attributes: readonly Attribute[],
    networkFee: BigNumber,
  ): Promise<TransactionResult<TransactionReceipt, ClaimTransaction>>;

  protected async invokeRaw<T extends TransactionReceipt>({
    invokeMethodOptionsOrScript,
    transfers = [],
    options = {},
    onConfirm,
    method,
    verify = true,
    scripts = [],
    labels = {},
    rawInputs = [],
    rawOutputs = [],
    sourceMaps,
    reorderOutputs = (outputs) => outputs,
  }: InvokeRawOptions<T>) {
    const { from, attributes: attributesIn, networkFee, systemFee } = this.getTransactionOptions(options);
    const { script, invokeMethodOptions } = this.getScriptAndInvokeMethodOptions(invokeMethodOptionsOrScript);

    return this.capture(
      async () => {
        const { gas, attributes } = await this.checkSystemFees({
          script,
          transfers,
          from,
          networkFee,
          systemFee,
          attributes: attributesIn,
          rawInputs,
          rawOutputs,
          scripts,
          sourceMaps,
          reorderOutputs,
        });

        const { inputs, outputs } = await this.getTransfersInputOutputs({
          transfers,
          from,
          gas: networkFee.plus(gas),
        });

        return invokeMethodOptions === undefined
          ? this.executeInvokeScript({
              script,
              from,
              attributes,
              inputs,
              outputs,
              rawInputs,
              rawOutputs,
              gas,
              verify,
              scripts,
              reorderOutputs,
              onConfirm,
              sourceMaps,
            })
          : this.executeInvokeMethod({
              script,
              invokeMethodOptions,
              from,
              attributes,
              inputs,
              outputs,
              rawInputs,
              rawOutputs,
              gas,
              verify,
              scripts,
              reorderOutputs,
              onConfirm,
              sourceMaps,
            });
      },
      {
        title: 'neo_invoke_raw',
        invoke: true,
        measures: {
          total: invokeDurationSec,
          error: invokeFailures,
        },
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
