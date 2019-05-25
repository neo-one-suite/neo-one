import {
  Account,
  AddressString,
  addressToScriptHash,
  Attribute,
  AttributeModel,
  Block,
  ClaimTransaction,
  common,
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
  RelayTransactionResult,
  ScriptBuilderParam,
  SourceMaps,
  Transaction,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UpdateAccountNameOptions,
  UserAccount,
  UserAccountID,
  utils,
  WitnessModel,
} from '@neo-one/client-common';
import { processActionsAndMessage } from '@neo-one/client-switch';
import { Labels, Monitor } from '@neo-one/monitor';
import { labels as labelNames, utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { Observable } from 'rxjs';
import { clientUtils } from '../clientUtils';
import {
  FundsInUseError,
  InsufficientFundsError,
  InsufficientSystemFeeError,
  InvalidArgumentError,
  InvokeError,
  NoAccountError,
  NothingToRefundError,
  NothingToSendError,
  NotImplementedError,
} from '../errors';
import { converters } from './converters';

export interface TransactionOptionsFull {
  readonly from: UserAccountID;
  readonly attributes: ReadonlyArray<Attribute>;
  readonly networkFee: BigNumber;
  readonly systemFee: BigNumber;
  readonly monitor?: Monitor;
}

export interface FullTransfer extends Transfer {
  readonly from: UserAccountID;
}

export interface InvokeMethodOptions {
  readonly contract: AddressString;
  readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
  readonly invokeMethod: string;
}

export interface InvokeRawOptions<T extends TransactionReceipt> {
  readonly options?: TransactionOptions;
  readonly transfers?: readonly FullTransfer[];
  readonly onConfirm: (options: {
    readonly transaction: Transaction;
    readonly data: RawInvocationData;
    readonly receipt: TransactionReceipt;
  }) => Promise<T> | T;
  readonly reorderOutputs?: (outputs: readonly Output[]) => readonly Output[];
  readonly invokeMethodOptions?: InvokeMethodOptions;
  readonly method: string;
  readonly verify?: boolean;
  readonly rawInputs?: readonly Input[];
  readonly rawOutputs?: readonly Output[];
  readonly scripts?: readonly WitnessModel[];
  readonly labels?: Labels;
  readonly script?: Buffer;
  readonly sourceMaps?: Promise<SourceMaps>;
}

export interface Provider {
  readonly networks$: Observable<ReadonlyArray<NetworkType>>;
  readonly getNetworks: () => ReadonlyArray<NetworkType>;
  readonly getUnclaimed: (
    network: NetworkType,
    address: AddressString,
    monitor?: Monitor,
  ) => Promise<{ readonly unclaimed: ReadonlyArray<Input>; readonly amount: BigNumber }>;
  readonly getUnspentOutputs: (
    network: NetworkType,
    address: AddressString,
    monitor?: Monitor,
  ) => Promise<ReadonlyArray<InputOutput>>;
  readonly relayTransaction: (
    network: NetworkType,
    transaction: string,
    monitor?: Monitor,
  ) => Promise<RelayTransactionResult>;
  readonly getTransactionReceipt: (
    network: NetworkType,
    hash: Hash256String,
    options?: GetOptions,
  ) => Promise<TransactionReceipt>;
  readonly getInvocationData: (
    network: NetworkType,
    hash: Hash256String,
    monitor?: Monitor,
  ) => Promise<RawInvocationData>;
  readonly testInvoke: (network: NetworkType, transaction: string, monitor?: Monitor) => Promise<RawCallReceipt>;
  readonly call: (
    network: NetworkType,
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ) => Promise<RawCallReceipt>;
  readonly getBlockCount: (network: NetworkType, monitor?: Monitor) => Promise<number>;
  readonly getTransaction: (network: NetworkType, hash: Hash256String, monitor?: Monitor) => Promise<Transaction>;
  readonly getOutput: (network: NetworkType, input: Input, monitor?: Monitor) => Promise<Output>;
  readonly iterBlocks: (network: NetworkType, options?: IterOptions) => AsyncIterable<Block>;
  readonly getAccount: (network: NetworkType, address: AddressString, monitor?: Monitor) => Promise<Account>;
  readonly iterActionsRaw?: (network: NetworkType, options?: IterOptions) => AsyncIterable<RawAction>;
}

export const NEO_ONE_ATTRIBUTE: Attribute = {
  usage: 'Remark15',
  data: Buffer.from('neo-one', 'utf8').toString('hex'),
};

export abstract class UserAccountProviderBase<TProvider extends Provider> {
  protected readonly mutableUsedOutputs: Set<string>;
  protected readonly provider: TProvider;
  protected mutableBlockCount: number;

  public constructor({ provider }: { readonly provider: TProvider }) {
    this.provider = provider;
    this.mutableBlockCount = 0;
    this.mutableUsedOutputs = new Set<string>();
  }

  public getCurrentUserAccount(): UserAccount | undefined {
    throw new NotImplementedError('getCurrentUserAccount');
  }

  public async selectUserAccount(_userAccountID?: UserAccountID, _monitor?: Monitor): Promise<void> {
    throw new NotImplementedError('selectUserAccount');
  }

  public async deleteUserAccount(_userAccountID?: UserAccountID, _monitor?: Monitor): Promise<void> {
    throw new NotImplementedError('deleteUserAccount');
  }

  public async updateUserAccountName(_options: UpdateAccountNameOptions): Promise<void> {
    throw new NotImplementedError('updateUserAccountName');
  }

  public async getBlockCount(network: NetworkType, monitor?: Monitor): Promise<number> {
    return this.provider.getBlockCount(network, monitor);
  }

  public iterBlocks(network: NetworkType, options?: IterOptions): AsyncIterable<Block> {
    return this.provider.iterBlocks(network, options);
  }

  public iterActionsRaw(network: NetworkType, options?: IterOptions): AsyncIterable<RawAction> {
    if (this.provider.iterActionsRaw === undefined) {
      throw new NotImplementedError('iterActionsRaw');
    }

    return this.provider.iterActionsRaw(network, options);
  }

  public async getAccount(network: NetworkType, address: AddressString, monitor?: Monitor): Promise<Account> {
    return this.provider.getAccount(network, address, monitor);
  }

  public async invoke(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    verify: boolean,
    options: InvokeSendUnsafeReceiveTransactionOptions = {},
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    const { attributes = [] } = options;
    const transactionOptions = this.getTransactionOptions(options);
    const { from } = transactionOptions;

    const transfers = this.setupInvoke({
      contract,
      network: from.network,
      from,
      sendFrom: options.sendFrom,
      sendTo: options.sendTo,
    });

    return this.invokeRaw({
      invokeMethodOptions: {
        contract,
        params,
        invokeMethod: method,
      },
      transfers,
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
      onConfirm: this.invokeOnConfirm,
      scripts: this.getInvokeScripts(
        method,
        params,
        verify && (options.sendFrom !== undefined || options.sendTo !== undefined),
      ),
      method: 'invoke',
      labels: {
        [labelNames.INVOKE_METHOD]: method,
      },
      verify,
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
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    const transactionOptions = this.getTransactionOptions(options);
    const { from, attributes } = transactionOptions;

    const { params, transfers } = this.setupInvokeSend({ contract, network: from.network, paramsIn, transfer });

    return this.invokeRaw({
      invokeMethodOptions: {
        contract,
        params,
        invokeMethod: method,
      },
      options: {
        ...transactionOptions,
        attributes: attributes.concat(this.getInvokeAttributes(contract, method, paramsZipped, false, from.address)),
      },
      onConfirm: this.invokeOnConfirm,
      scripts: this.getInvokeScripts(method, params, true),
      transfers,
      reorderOutputs: this.reorderInvokeSendOutputs(transfer.amount),
      method: 'invokeSend',
      labels: {
        [labelNames.INVOKE_METHOD]: method,
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
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    const transactionOptions = this.getTransactionOptions(options);
    const { from, attributes, monitor } = transactionOptions;

    const { inputs, outputs } = await this.setupInvokeRefundAssets({
      contract,
      provider: this.provider,
      network: from.network,
      hash,
      from,
      monitor,
    });

    return this.invokeRaw({
      invokeMethodOptions: {
        contract,
        params,
        invokeMethod: method,
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
        [labelNames.INVOKE_METHOD]: method,
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
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    const transactionOptions = this.getTransactionOptions(options);
    const { from, attributes, monitor } = transactionOptions;

    const { inputs, outputs } = await this.setupInvokeCompleteSendAssets({
      provider: this.provider,
      network: from.network,
      hash,
      from,
      monitor,
    });

    return this.invokeRaw({
      invokeMethodOptions: {
        contract,
        params,
        invokeMethod: method,
      },
      options: {
        ...transactionOptions,
        attributes: attributes.concat(this.getInvokeAttributes(contract, method, paramsZipped, false, from.address)),
      },
      onConfirm: this.invokeOnConfirm,
      scripts: this.getInvokeScripts(method, params, true),
      rawInputs: inputs,
      rawOutputs: outputs,
      method: 'invokeCompleteSend',
      labels: {
        [labelNames.INVOKE_METHOD]: method,
      },
      sourceMaps,
    });
  }

  public async call(
    network: NetworkType,
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ): Promise<RawCallReceipt> {
    return this.provider.call(network, contract, method, params, monitor);
  }

  public async claim(_options?: TransactionOptions): Promise<TransactionResult<TransactionReceipt, ClaimTransaction>> {
    throw new NotImplementedError('claim');
  }

  public async invokeClaim(
    _contract: AddressString,
    _method: string,
    _params: ReadonlyArray<ScriptBuilderParam | undefined>,
    _paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    _options?: TransactionOptions,
    _sourceMaps?: Promise<SourceMaps>,
  ): Promise<TransactionResult<TransactionReceipt, ClaimTransaction>> {
    throw new NotImplementedError('invokeClaim');
  }

  protected async invokeRawGetInputsOutputs(
    script: Buffer,
    from: UserAccountID,
    networkFee: BigNumber,
    systemFee: BigNumber,
    attributesIn: readonly Attribute[],
    transfers: readonly FullTransfer[],
    rawInputs?: readonly Input[],
    rawOutputs?: readonly Output[],
    scripts?: readonly WitnessModel[],
    sourceMaps?: Promise<SourceMaps>,
    monitor?: Monitor,
    reorderOutputs?: (outputs: readonly Output[]) => readonly Output[],
  ) {
    const { gas, attributes } = await this.checkSystemFees({
      script,
      transfers,
      from,
      networkFee,
      systemFee,
      provider: this.provider,
      attributes: attributesIn,
      rawInputs,
      rawOutputs,
      scripts,
      sourceMaps,
      monitor,
      reorderOutputs,
    });

    const { inputs, outputs } = await this.getTransfersInputOutputs({
      transfers,
      from,
      gas: networkFee.plus(gas),
      provider: this.provider,
      monitor,
    });

    return {
      gas,
      attributes,
      inputs,
      outputs,
    };
  }

  protected invokeRawSetup(
    options: TransactionOptions,
    invokeMethodOptions: InvokeMethodOptions | undefined,
    scriptIn?: Buffer,
  ) {
    const { from, attributes, networkFee, systemFee, monitor } = this.getTransactionOptions(options);
    if (invokeMethodOptions === undefined) {
      throw new InvalidArgumentError('InvokeMethodOptions', 'invokeMethodOptions', invokeMethodOptions);
    }
    const { contract, invokeMethod, params } = invokeMethodOptions;

    const script =
      scriptIn === undefined
        ? clientUtils.getInvokeMethodScript({
            address: contract,
            method: invokeMethod,
            params,
          })
        : scriptIn;

    return {
      from,
      script,
      attributes,
      networkFee,
      systemFee,
      contract,
      invokeMethod,
      params,
      monitor,
    };
  }

  protected abstract async invokeRaw<T extends TransactionReceipt>(
    options: InvokeRawOptions<T>,
  ): Promise<TransactionResult<T, InvocationTransaction>>;

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
      monitor: options.monitor,
    };
  }

  protected async getUnspentOutputsBase<TProvider extends Provider>({
    from,
    provider,
    monitor,
  }: {
    readonly from: UserAccountID;
    readonly provider: TProvider;
    readonly monitor?: Monitor;
  }): Promise<{ readonly unspentOutputs: ReadonlyArray<InputOutput>; readonly wasFiltered: boolean }> {
    const [newBlockCount, allUnspentsIn] = await Promise.all([
      provider.getBlockCount(from.network, monitor),
      provider.getUnspentOutputs(from.network, from.address, monitor),
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

  protected async getTransfersInputOutputs<TProvider extends Provider>({
    transfers,
    from,
    gas,
    provider,
    monitor,
  }: {
    readonly transfers: ReadonlyArray<FullTransfer>;
    readonly from: UserAccountID;
    readonly gas: BigNumber;
    readonly provider: TProvider;
    readonly monitor?: Monitor;
  }): Promise<{ readonly outputs: ReadonlyArray<Output>; readonly inputs: ReadonlyArray<InputOutput> }> {
    if (transfers.length === 0 && gas.lte(utils.ZERO_BIG_NUMBER)) {
      return { inputs: [], outputs: [] };
    }

    const mutableGroupedTransfers = _.groupBy(transfers, ({ from: transferFrom }) => transferFrom.address);
    if (gas.isGreaterThan(utils.ZERO_BIG_NUMBER)) {
      const fromTransfers = mutableGroupedTransfers[from.address] as ReadonlyArray<FullTransfer> | undefined;
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
          provider,
          monitor,
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

  protected async getTransfersInputOutputsFrom<TProvider extends Provider>({
    transfers,
    from,
    provider,
    monitor,
  }: {
    readonly transfers: ReadonlyArray<Transfer>;
    readonly from: UserAccountID;
    readonly provider: TProvider;
    readonly monitor?: Monitor;
  }): Promise<{ readonly outputs: ReadonlyArray<Output>; readonly inputs: ReadonlyArray<InputOutput> }> {
    const { unspentOutputs: allOutputs, wasFiltered } = await this.getUnspentOutputsBase({ from, provider, monitor });

    return Object.values(_.groupBy(transfers, ({ asset }) => asset)).reduce(
      (acc, toByAsset) => {
        const { asset } = toByAsset[0];
        const assetResults = toByAsset.reduce<{
          remaining: BigNumber;
          remainingOutputs: ReadonlyArray<InputOutput>;
          inputs: ReadonlyArray<InputOutput>;
          outputs: ReadonlyArray<Output>;
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
      { inputs: [] as InputOutput[], outputs: [] as Output[] },
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
    readonly remainingOutputs: ReadonlyArray<InputOutput>;
    readonly remaining: BigNumber;
    readonly wasFiltered: boolean;
  }): {
    readonly inputs: ReadonlyArray<InputOutput>;
    readonly outputs: ReadonlyArray<Output>;
    readonly remainingOutputs: ReadonlyArray<InputOutput>;
    readonly remaining: BigNumber;
  } {
    const amount = originalAmount.minus(remaining);

    const outputs: Output[] =
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

    // tslint:disable-next-line no-array-mutation
    const outputsOrdered = (remainingOutputs as InputOutput[])
      .sort((coinA, coinB) => coinA.value.comparedTo(coinB.value))
      .reverse();

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

  protected convertAttributes(attributes: ReadonlyArray<Attribute>): ReadonlyArray<AttributeModel> {
    return attributes.map((attribute) => converters.attribute(attribute));
  }

  protected convertInputs(inputs: ReadonlyArray<Input>): ReadonlyArray<InputModel> {
    return inputs.map((input) => converters.input(input));
  }

  protected convertOutputs(outputs: ReadonlyArray<Output>): ReadonlyArray<OutputModel> {
    return outputs.map((output) => converters.output(output));
  }

  protected mapSendReceiveToFullTransfers({
    contractID,
    from,
    send,
    receive,
  }: {
    readonly contractID: UserAccountID;
    readonly from: UserAccountID;
    readonly send: ReadonlyArray<Transfer>;
    readonly receive: ReadonlyArray<Omit<Transfer, 'to'>>;
  }): ReadonlyArray<FullTransfer> {
    return send
      .map((transfer) => ({ ...transfer, from: contractID }))
      .concat(receive.map((transfer) => ({ ...transfer, from, to: contractID.address })));
  }

  protected getInvokeScripts(
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    verify: boolean,
  ): ReadonlyArray<WitnessModel> {
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

  protected setupInvoke({
    contract,
    network,
    from,
    sendFrom,
    sendTo,
  }: {
    readonly contract: AddressString;
    readonly network: NetworkType;
    readonly from: UserAccountID;
    readonly sendFrom: ReadonlyArray<Transfer> | undefined;
    readonly sendTo: ReadonlyArray<Omit<Transfer, 'to'>> | undefined;
  }): ReadonlyArray<FullTransfer> {
    const send = sendFrom === undefined ? [] : sendFrom;
    const receive = sendTo === undefined ? [] : sendTo;

    return this.mapSendReceiveToFullTransfers({
      contractID: {
        address: contract,
        network,
      },
      from,
      send,
      receive,
    });
  }

  protected setupInvokeSend({
    contract,
    network,
    paramsIn,
    transfer,
  }: {
    readonly contract: AddressString;
    readonly network: NetworkType;
    readonly paramsIn: ReadonlyArray<ScriptBuilderParam | undefined>;
    readonly transfer: Transfer;
  }): {
    readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
    readonly transfers: ReadonlyArray<FullTransfer>;
  } {
    const contractID: UserAccountID = {
      address: contract,
      network,
    };

    const params = paramsIn.concat([common.stringToUInt160(addressToScriptHash(transfer.to))]);
    const transfers = [
      {
        ...transfer,
        to: contract,
        from: contractID,
      },
    ];

    return {
      params,
      transfers,
    };
  }

  protected async setupInvokeCompleteSendAssets<TProvider extends Provider>({
    provider,
    network,
    hash,
    from,
    monitor,
  }: {
    readonly provider: TProvider;
    readonly network: NetworkType;
    readonly hash: Hash256String;
    readonly from: UserAccountID;
    readonly monitor?: Monitor;
  }): Promise<{ readonly inputs: ReadonlyArray<Input>; readonly outputs: ReadonlyArray<Output> }> {
    const sendTransaction = await provider.getTransaction(network, hash, monitor);
    if (sendTransaction.outputs.length === 0) {
      throw new NothingToSendError();
    }

    const sendInput = { hash, index: 0 };
    const sendOutput = {
      ...sendTransaction.outputs[0],
      address: from.address,
    };

    return {
      inputs: [sendInput],
      outputs: [sendOutput],
    };
  }

  protected async setupInvokeRefundAssets<TProvider extends Provider>({
    contract,
    provider,
    network,
    hash,
    from,
    monitor,
  }: {
    readonly contract: AddressString;
    readonly provider: TProvider;
    readonly network: NetworkType;
    readonly hash: Hash256String;
    readonly from: UserAccountID;
    readonly monitor?: Monitor;
  }): Promise<{ readonly inputs: ReadonlyArray<Input>; readonly outputs: ReadonlyArray<Output> }> {
    const refundTransaction = await provider.getTransaction(network, hash, monitor);
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

    return { inputs, outputs };
  }

  protected async checkSystemFees<TProvider extends Provider>({
    script,
    transfers = [],
    from,
    networkFee,
    systemFee,
    provider,
    attributes: attributesIn = [],
    rawInputs = [],
    rawOutputs = [],
    scripts = [],
    sourceMaps,
    monitor,
    reorderOutputs = (outputs) => outputs,
  }: {
    readonly script: Buffer;
    readonly transfers?: ReadonlyArray<FullTransfer>;
    readonly from: UserAccountID;
    readonly networkFee: BigNumber;
    readonly systemFee: BigNumber;
    readonly provider: TProvider;
    readonly attributes?: ReadonlyArray<Attribute>;
    readonly rawInputs?: ReadonlyArray<Input>;
    readonly rawOutputs?: ReadonlyArray<Output>;
    readonly scripts?: ReadonlyArray<WitnessModel>;
    readonly sourceMaps?: Promise<SourceMaps>;
    readonly monitor?: Monitor;
    readonly reorderOutputs?: (outputs: ReadonlyArray<Output>) => ReadonlyArray<Output>;
  }): Promise<{
    readonly gas: BigNumber;
    readonly attributes: ReadonlyArray<Attribute>;
  }> {
    const { inputs: testInputs, outputs: testOutputs } = await this.getTransfersInputOutputs({
      transfers,
      from,
      gas: networkFee,
      provider,
      monitor,
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

    const callReceipt = await provider.testInvoke(
      from.network,
      testTransaction.serializeWire().toString('hex'),
      monitor,
    );

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

  protected reorderInvokeSendOutputs(amount: BigNumber): (outputs: ReadonlyArray<Output>) => ReadonlyArray<Output> {
    return (outputs: ReadonlyArray<Output>) => {
      const output = outputs.find(({ value }) => value.isEqualTo(amount));
      if (output === undefined) {
        throw new Error('Something went wrong.');
      }
      const outputIdx = outputs.indexOf(output);
      if (outputIdx === -1) {
        throw new Error('Something went wrong.');
      }

      return [outputs[outputIdx]].concat(outputs.slice(0, outputIdx)).concat(outputs.slice(outputIdx + 1));
    };
  }

  protected invokeOnConfirm({
    receipt,
    data,
  }: {
    readonly receipt: TransactionReceipt;
    readonly data: RawInvocationData;
  }) {
    return {
      blockIndex: receipt.blockIndex,
      blockHash: receipt.blockHash,
      transactionIndex: receipt.transactionIndex,
      globalIndex: receipt.globalIndex,
      result: data.result,
      actions: data.actions,
    };
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
}
