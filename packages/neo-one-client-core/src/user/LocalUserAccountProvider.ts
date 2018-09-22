import {
  Account,
  AddressString,
  addressToScriptHash,
  Attribute,
  AttributeModel,
  AttributeUsageModel,
  Block,
  BlockFilter,
  ClaimTransaction,
  ClaimTransactionModel,
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
  ScriptBuilder,
  ScriptBuilderParam,
  SourceMaps,
  Transaction,
  TransactionBaseModel,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UInt160AttributeModel,
  UpdateAccountNameOptions,
  UserAccount,
  UserAccountID,
  UserAccountProvider,
  utils,
  Witness,
  WitnessModel,
} from '@neo-one/client-common';
import { processActionsAndMessage } from '@neo-one/client-switch';
import { Counter, Histogram, Labels, metrics, Monitor } from '@neo-one/monitor';
import { labels as labelNames, utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
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
  NothingToTransferError,
} from '../errors';
import { converters } from './converters';

export interface KeyStore {
  readonly type: string;
  readonly byteLimit?: number;
  readonly currentUserAccount$: Observable<UserAccount | undefined>;
  readonly getCurrentUserAccount: () => UserAccount | undefined;
  readonly userAccounts$: Observable<ReadonlyArray<UserAccount>>;
  readonly getUserAccounts: () => ReadonlyArray<UserAccount>;
  readonly selectUserAccount: (id?: UserAccountID, monitor?: Monitor) => Promise<void>;
  readonly deleteUserAccount: (id: UserAccountID, monitor?: Monitor) => Promise<void>;
  readonly updateUserAccountName: (options: UpdateAccountNameOptions) => Promise<void>;
  readonly sign: (
    options: {
      readonly account: UserAccountID;
      readonly message: string;
      readonly monitor?: Monitor;
    },
  ) => Promise<Witness>;
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
  readonly iterBlocks: (network: NetworkType, filter?: BlockFilter) => AsyncIterable<Block>;
  readonly getAccount: (network: NetworkType, address: AddressString, monitor?: Monitor) => Promise<Account>;
  readonly iterActionsRaw: (network: NetworkType, filter?: BlockFilter) => AsyncIterable<RawAction>;
}

interface TransactionOptionsFull {
  readonly from: UserAccountID;
  readonly attributes: ReadonlyArray<Attribute>;
  readonly networkFee: BigNumber;
  readonly systemFee: BigNumber;
  readonly monitor?: Monitor;
}

const NEO_ONE_ATTRIBUTE: Attribute = {
  usage: 'Remark15',
  data: Buffer.from('neo-one', 'utf8').toString('hex'),
};

const NEO_TRANSFER_DURATION_SECONDS = metrics.createHistogram({
  name: 'neo_transfer_duration_seconds',
});

const NEO_TRANSFER_FAILURES_TOTAL = metrics.createCounter({
  name: 'neo_transfer_failures_total',
});

const NEO_CLAIM_DURATION_SECONDS = metrics.createHistogram({
  name: 'neo_claim_duration_seconds',
});

const NEO_CLAIM_FAILURES_TOTAL = metrics.createCounter({
  name: 'neo_claim_failures_total',
});

const NEO_INVOKE_RAW_DURATION_SECONDS = metrics.createHistogram({
  name: 'neo_invoke_raw_duration_seconds',
  labelNames: [labelNames.INVOKE_RAW_METHOD],
});

const NEO_INVOKE_RAW_FAILURES_TOTAL = metrics.createCounter({
  name: 'neo_invoke_raw_failures_total',
  labelNames: [labelNames.INVOKE_RAW_METHOD],
});

interface FullTransfer extends Transfer {
  readonly from: UserAccountID;
}

export class LocalUserAccountProvider<TKeyStore extends KeyStore, TProvider extends Provider>
  implements UserAccountProvider {
  public readonly type: string;
  public readonly currentUserAccount$: Observable<UserAccount | undefined>;
  public readonly userAccounts$: Observable<ReadonlyArray<UserAccount>>;
  public readonly networks$: Observable<ReadonlyArray<NetworkType>>;
  public readonly keystore: TKeyStore;
  public readonly provider: TProvider;
  protected readonly mutableUsedOutputs: Set<string>;
  protected mutableBlockCount: number;

  public constructor({ keystore, provider }: { readonly keystore: TKeyStore; readonly provider: TProvider }) {
    this.type = keystore.type;
    this.keystore = keystore;
    this.provider = provider;

    this.currentUserAccount$ = keystore.currentUserAccount$;
    this.userAccounts$ = keystore.userAccounts$;
    this.networks$ = provider.networks$;

    this.mutableBlockCount = 0;
    this.mutableUsedOutputs = new Set<string>();
  }

  public getCurrentUserAccount(): UserAccount | undefined {
    return this.keystore.getCurrentUserAccount();
  }

  public getUserAccounts(): ReadonlyArray<UserAccount> {
    return this.keystore.getUserAccounts();
  }

  public getNetworks(): ReadonlyArray<NetworkType> {
    return this.provider.getNetworks();
  }

  public iterBlocks(network: NetworkType, filter?: BlockFilter): AsyncIterable<Block> {
    return this.provider.iterBlocks(network, filter);
  }

  public async getBlockCount(network: NetworkType, monitor?: Monitor): Promise<number> {
    return this.provider.getBlockCount(network, monitor);
  }

  public async getAccount(network: NetworkType, address: AddressString, monitor?: Monitor): Promise<Account> {
    return this.provider.getAccount(network, address, monitor);
  }

  public iterActionsRaw(network: NetworkType, filter?: BlockFilter): AsyncIterable<RawAction> {
    return this.provider.iterActionsRaw(network, filter);
  }

  public async transfer(
    transfers: ReadonlyArray<Transfer>,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt, InvocationTransaction>> {
    const { from, attributes, networkFee, monitor } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        const { inputs, outputs } = await this.getTransfersInputOutputs({
          transfers: transfers.map((transfer) => ({ from, ...transfer })),
          from,
          gas: networkFee,
          monitor: span,
        });

        if (inputs.length === 0 && this.keystore.byteLimit === undefined) {
          throw new NothingToTransferError();
        }

        const transaction = new InvocationTransactionModel({
          inputs: this.convertInputs(inputs),
          outputs: this.convertOutputs(outputs),
          attributes: this.convertAttributes(attributes),
          gas: utils.ZERO,
          script: new ScriptBuilder().emitOp('PUSH1').build(),
        });

        return this.sendTransaction<InvocationTransaction>({
          from,
          transaction,
          inputs,
          onConfirm: async ({ receipt }) => receipt,
          monitor: span,
        });
      },
      {
        name: 'neo_transfer',
        metric: {
          total: NEO_TRANSFER_DURATION_SECONDS,
          error: NEO_TRANSFER_FAILURES_TOTAL,
        },
      },
      monitor,
    );
  }

  public async claim(options?: TransactionOptions): Promise<TransactionResult<TransactionReceipt, ClaimTransaction>> {
    const { from, attributes, networkFee, monitor } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        const [{ unclaimed, amount }, { inputs, outputs }] = await Promise.all([
          this.provider.getUnclaimed(from.network, from.address, span),
          this.getTransfersInputOutputs({
            from,
            gas: networkFee,
            transfers: [],
            monitor: span,
          }),
        ]);

        if (unclaimed.length === 0) {
          throw new NothingToClaimError(from);
        }

        const transaction = new ClaimTransactionModel({
          inputs: this.convertInputs(inputs),
          claims: this.convertInputs(unclaimed),
          outputs: this.convertOutputs(
            outputs.concat([
              {
                address: from.address,
                asset: common.GAS_ASSET_HASH,
                value: amount,
              },
            ]),
          ),
          attributes: this.convertAttributes(attributes),
        });

        return this.sendTransaction<ClaimTransaction>({
          inputs,
          from,
          transaction,
          onConfirm: async ({ receipt }) => receipt,
          monitor: span,
        });
      },
      {
        name: 'neo_claim',
        metric: {
          total: NEO_CLAIM_DURATION_SECONDS,
          error: NEO_CLAIM_FAILURES_TOTAL,
        },
      },
      monitor,
    );
  }

  public async invoke(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    verify: boolean,
    options: InvokeSendUnsafeReceiveTransactionOptions = {},
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
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
      script: clientUtils.getInvokeMethodScript({
        address: contract,
        method,
        params,
      }),
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
        [labelNames.INVOKE_METHOD]: method,
      },
      sourceMaps,
    });
  }

  public async invokeSend(
    contract: AddressString,
    method: string,
    paramsIn: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    transfer: Transfer,
    options: TransactionOptions = {},
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    const transactionOptions = this.getTransactionOptions(options);
    const { from, attributes } = transactionOptions;

    const contractID: UserAccountID = {
      address: contract,
      network: from.network,
    };

    const params = paramsIn.concat([common.stringToUInt160(addressToScriptHash(transfer.to))]);

    return this.invokeRaw({
      script: clientUtils.getInvokeMethodScript({
        address: contract,
        method,
        params,
      }),
      options: {
        ...transactionOptions,
        attributes: attributes.concat(this.getInvokeAttributes(contract, method, paramsZipped, false, from.address)),
      },
      onConfirm: ({ receipt, data }): RawInvokeReceipt => ({
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.transactionIndex,
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
        [labelNames.INVOKE_METHOD]: method,
      },
      sourceMaps,
    });
  }

  public async invokeCompleteSend(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    hash: Hash256String,
    options: TransactionOptions = {},
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    const transactionOptions = this.getTransactionOptions(options);
    const { from, attributes, monitor } = transactionOptions;

    const sendTransaction = await this.provider.getTransaction(from.network, hash, monitor);
    if (sendTransaction.outputs.length === 0) {
      throw new NothingToSendError();
    }
    const sendInput = { hash, index: 0 };
    const sendOutput = {
      ...sendTransaction.outputs[0],
      address: from.address,
    };

    return this.invokeRaw({
      script: clientUtils.getInvokeMethodScript({
        address: contract,
        method,
        params,
      }),
      options: {
        ...transactionOptions,
        attributes: attributes.concat(this.getInvokeAttributes(contract, method, paramsZipped, false, from.address)),
      },
      onConfirm: ({ receipt, data }): RawInvokeReceipt => ({
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.transactionIndex,
        result: data.result,
        actions: data.actions,
      }),
      scripts: this.getInvokeScripts(method, params, true),
      rawInputs: [sendInput],
      rawOutputs: [sendOutput],
      method: 'invokeCompleteSend',
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
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    hash: Hash256String,
    options: TransactionOptions = {},
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    const transactionOptions = this.getTransactionOptions(options);
    const { from, attributes, monitor } = transactionOptions;

    const refundTransaction = await this.provider.getTransaction(from.network, hash, monitor);
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
      script: clientUtils.getInvokeMethodScript({
        address: contract,
        method,
        params,
      }),
      options: {
        ...transactionOptions,
        attributes: attributes.concat(this.getInvokeAttributes(contract, method, paramsZipped, false, from.address)),
      },
      onConfirm: ({ receipt, data }): RawInvokeReceipt => ({
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.transactionIndex,
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

  public async invokeClaim(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    options: TransactionOptions = {},
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<TransactionReceipt, ClaimTransaction>> {
    const { from, attributes, networkFee, monitor } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        const [{ unclaimed, amount }, { inputs, outputs }] = await Promise.all([
          this.provider.getUnclaimed(from.network, contract, span),
          this.getTransfersInputOutputs({
            from,
            gas: networkFee,
            transfers: [],
            monitor: span,
          }),
        ]);

        if (unclaimed.length === 0) {
          throw new NothingToClaimError(from);
        }

        const transaction = new ClaimTransactionModel({
          inputs: this.convertInputs(inputs),
          claims: this.convertInputs(unclaimed),
          outputs: this.convertOutputs(
            outputs.concat([
              {
                address: from.address,
                asset: common.GAS_ASSET_HASH,
                value: amount,
              },
            ]),
          ),
          attributes: this.convertAttributes(
            // By definition, the contract address is a claim input so the script hash is already included
            // By definition, the from address is not an input or a claim, so we need to add it
            attributes.concat(this.getInvokeAttributes(contract, method, paramsZipped, false, from.address)),
          ),
          // Since the contract address is an input, we must add a witness for it.
          scripts: this.getInvokeScripts(method, params, true),
        });

        return this.sendTransaction<ClaimTransaction>({
          inputs,
          from,
          transaction,
          onConfirm: async ({ receipt }) => receipt,
          monitor: span,
          sourceMaps,
        });
      },
      {
        name: 'neo_claim',
        metric: {
          total: NEO_CLAIM_DURATION_SECONDS,
          error: NEO_CLAIM_FAILURES_TOTAL,
        },
      },
      monitor,
    );
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

  public async selectUserAccount(id?: UserAccountID, monitor?: Monitor): Promise<void> {
    await this.keystore.selectUserAccount(id, monitor);
  }

  public async deleteUserAccount(id: UserAccountID, monitor?: Monitor): Promise<void> {
    await this.keystore.deleteUserAccount(id, monitor);
  }

  public async updateUserAccountName(options: UpdateAccountNameOptions): Promise<void> {
    await this.keystore.updateUserAccountName(options);
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
      monitor: options.monitor,
    };
  }

  protected getInvokeAttributes(
    contract: AddressString,
    method: string,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    verify: boolean,
    from?: AddressString,
  ): ReadonlyArray<Attribute> {
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

  protected async invokeRaw<T extends TransactionReceipt>({
    script,
    transfers = [],
    options = {},
    onConfirm,
    method,
    scripts = [],
    labels = {},
    rawInputs = [],
    rawOutputs = [],
    sourceMaps,
    reorderOutputs = (outputs) => outputs,
  }: {
    readonly script: Buffer;
    readonly transfers?: ReadonlyArray<FullTransfer>;
    readonly options?: TransactionOptions;
    readonly onConfirm: (
      options: {
        readonly transaction: Transaction;
        readonly data: RawInvocationData;
        readonly receipt: TransactionReceipt;
      },
    ) => Promise<T> | T;
    readonly method: string;
    readonly scripts?: ReadonlyArray<WitnessModel>;
    readonly labels?: Labels;
    readonly rawInputs?: ReadonlyArray<Input>;
    readonly rawOutputs?: ReadonlyArray<Output>;
    readonly sourceMaps?: Promise<SourceMaps>;
    readonly reorderOutputs?: (outputs: ReadonlyArray<Output>) => ReadonlyArray<Output>;
  }): Promise<TransactionResult<T, InvocationTransaction>> {
    const { from, attributes: attributesIn, networkFee, systemFee, monitor } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        const { inputs: testInputs, outputs: testOutputs } = await this.getTransfersInputOutputs({
          transfers,
          from,
          gas: networkFee,
          monitor: span,
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

        const callReceipt = await this.provider.testInvoke(
          from.network,
          testTransaction.serializeWire().toString('hex'),
          span,
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

        const { inputs, outputs } = await this.getTransfersInputOutputs({
          transfers,
          from,
          gas: networkFee.plus(gas),
          monitor: span,
        });

        const invokeTransaction = new InvocationTransactionModel({
          version: 1,
          inputs: this.convertInputs(rawInputs.concat(inputs)),
          outputs: this.convertOutputs(reorderOutputs(rawOutputs.concat(outputs))),
          attributes: this.convertAttributes(attributes),
          gas: utils.bigNumberToBN(gas, 8),
          script,
          scripts,
        });

        try {
          // tslint:disable-next-line prefer-immediate-return
          const result = await this.sendTransaction<InvocationTransaction, T>({
            from,
            inputs,
            transaction: invokeTransaction,
            onConfirm: async ({ transaction, receipt }) => {
              const data = await this.provider.getInvocationData(from.network, transaction.hash);

              return onConfirm({ transaction, receipt, data });
            },
            sourceMaps,
            monitor: span,
          });

          // tslint:disable-next-line:no-var-before-return
          return result;
        } catch (error) {
          const message = await processActionsAndMessage({
            actions: [],
            message: error.message,
            sourceMaps,
          });
          if (message === error.message) {
            throw error;
          }

          throw new Error(message);
        }
      },
      {
        name: 'neo_invoke_raw',
        labels: {
          ...labels,
          [labelNames.INVOKE_RAW_METHOD]: method,
        },

        metric: {
          total: NEO_INVOKE_RAW_DURATION_SECONDS,
          error: NEO_INVOKE_RAW_FAILURES_TOTAL,
        },
      },
      monitor,
    );
  }

  protected async sendTransaction<TTransaction extends Transaction, T extends TransactionReceipt = TransactionReceipt>({
    inputs,
    transaction: transactionUnsignedIn,
    from,
    onConfirm,
    sourceMaps,
    monitor,
  }: {
    readonly inputs: ReadonlyArray<InputOutput>;
    readonly transaction: TransactionBaseModel;
    readonly from: UserAccountID;
    readonly onConfirm: (
      options: {
        readonly transaction: Transaction;
        readonly receipt: TransactionReceipt;
      },
    ) => Promise<T>;
    readonly sourceMaps?: Promise<SourceMaps>;
    readonly monitor?: Monitor;
  }): Promise<TransactionResult<T, TTransaction>> {
    return this.capture(
      async (span) => {
        let transactionUnsigned = transactionUnsignedIn;
        if (this.keystore.byteLimit !== undefined) {
          transactionUnsigned = await this.consolidate({
            inputs,
            from,
            transactionUnsignedIn,
            monitor,
            byteLimit: this.keystore.byteLimit,
          });
        }
        const address = from.address;
        if (
          transactionUnsigned.inputs.length === 0 &&
          // tslint:disable no-any
          ((transactionUnsigned as any).claims == undefined ||
            !Array.isArray((transactionUnsigned as any).claims) ||
            (transactionUnsigned as any).claims.length === 0)
          // tslint:enable no-any
        ) {
          transactionUnsigned = transactionUnsigned.clone({
            attributes: transactionUnsigned.attributes.concat(
              this.convertAttributes([
                {
                  usage: 'Script',
                  data: address,
                },
              ]),
            ),
          });
        }

        const [witness, inputOutputs, claimOutputs] = await Promise.all([
          this.keystore.sign({
            account: from,
            message: transactionUnsigned.serializeUnsigned().toString('hex'),
            monitor: span,
          }),
          Promise.all(
            transactionUnsigned.inputs.map(async (input) =>
              this.provider.getOutput(from.network, { hash: common.uInt256ToString(input.hash), index: input.index }),
            ),
          ),
          transactionUnsigned instanceof ClaimTransactionModel
            ? Promise.all(
                transactionUnsigned.claims.map(async (input) =>
                  this.provider.getOutput(from.network, {
                    hash: common.uInt256ToString(input.hash),
                    index: input.index,
                  }),
                ),
              )
            : Promise.resolve([]),
        ]);

        const result = await this.provider.relayTransaction(
          from.network,
          this.addWitness({
            transaction: transactionUnsigned,
            inputOutputs: inputOutputs.concat(claimOutputs),
            address,
            witness: this.convertWitness(witness),
          })
            .serializeWire()
            .toString('hex'),
          span,
        );
        const failures =
          result.verifyResult === undefined
            ? []
            : result.verifyResult.verifications.filter(({ failureMessage }) => failureMessage !== undefined);
        if (failures.length > 0) {
          const message = await processActionsAndMessage({
            actions: failures.reduce<ReadonlyArray<RawAction>>((acc, { actions }) => acc.concat(actions), []),
            message: failures
              .map(({ failureMessage }) => failureMessage)
              .filter(commonUtils.notNull)
              .join(' '),
            sourceMaps,
          });

          throw new InvokeError(message);
        }

        (transactionUnsigned.inputs as ReadonlyArray<InputModel>).forEach((transfer) =>
          this.mutableUsedOutputs.add(`${common.uInt256ToString(transfer.hash)}:${transfer.index}`),
        );

        const { transaction } = result;

        return {
          transaction: transaction as TTransaction,
          // tslint:disable-next-line no-unnecessary-type-annotation
          confirmed: async (optionsIn: GetOptions = {}): Promise<T> => {
            const options = {
              ...optionsIn,
              timeoutMS: optionsIn.timeoutMS === undefined ? 120000 : optionsIn.timeoutMS,
            };
            const receipt = await this.provider.getTransactionReceipt(from.network, transaction.hash, options);

            return onConfirm({ transaction, receipt });
          },
        };
      },
      {
        name: 'neo_send_transaction',
      },
      monitor,
    );
  }

  protected async consolidate({
    inputs,
    transactionUnsignedIn,
    from,
    monitor,
    byteLimit,
  }: {
    readonly transactionUnsignedIn: TransactionBaseModel;
    readonly inputs: ReadonlyArray<InputOutput>;
    readonly from: UserAccountID;
    readonly monitor?: Monitor;
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

    const { unspentOutputs: consolidatableUnspents } = await this.getUnspentOutputs({ from, monitor });
    const assetToInputOutputsUnsorted = consolidatableUnspents
      .filter((unspent) => !inputs.some((input) => unspent.hash === input.hash && unspent.index === input.index))
      .reduce<{ [key: string]: ReadonlyArray<InputOutput> }>((acc, unspent) => {
        if ((acc[unspent.asset] as ReadonlyArray<InputOutput> | undefined) !== undefined) {
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
        [_asset]: outputs.sort((coinA, coinB) => coinA.value.comparedTo(coinB.value)),
      }),
      assetToInputOutputsUnsorted,
    );

    const { newInputs, updatedOutputs, remainingAssetToInputOutputs } = transactionUnsignedIn.outputs.reduce(
      (
        acc: {
          readonly newInputs: ReadonlyArray<InputModel>;
          readonly updatedOutputs: ReadonlyArray<OutputModel>;
          readonly remainingAssetToInputOutputs: typeof assetToInputOutputs;
        },
        output,
      ) => {
        const asset = common.uInt256ToString(output.asset);

        const unspentOutputsIn = acc.remainingAssetToInputOutputs[asset] as ReadonlyArray<InputOutput> | undefined;

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
          readonly finalInputs: ReadonlyArray<InputModel>;
          readonly newOutputs: ReadonlyArray<OutputModel>;
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
    readonly inputOutputs: ReadonlyArray<Output>;
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
          (value) => value[0],
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
    monitor,
  }: {
    readonly from: UserAccountID;
    readonly monitor?: Monitor;
  }): Promise<{ readonly unspentOutputs: ReadonlyArray<InputOutput>; readonly wasFiltered: boolean }> {
    const [newBlockCount, allUnspentsIn] = await Promise.all([
      this.provider.getBlockCount(from.network, monitor),
      this.provider.getUnspentOutputs(from.network, from.address, monitor),
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
    monitor,
  }: {
    readonly transfers: ReadonlyArray<FullTransfer>;
    readonly from: UserAccountID;
    readonly gas: BigNumber;
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

  protected async getTransfersInputOutputsFrom({
    transfers,
    from,
    monitor,
  }: {
    readonly transfers: ReadonlyArray<Transfer>;
    readonly from: UserAccountID;
    readonly monitor?: Monitor;
  }): Promise<{ readonly outputs: ReadonlyArray<Output>; readonly inputs: ReadonlyArray<InputOutput> }> {
    const { unspentOutputs: allOutputs, wasFiltered } = await this.getUnspentOutputs({ from, monitor });

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

    const outputsOrdered = remainingOutputs.sort((coinA, coinB) => coinA.value.comparedTo(coinB.value)).reverse();

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
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
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

  protected convertAttributes(attributes: ReadonlyArray<Attribute>): ReadonlyArray<AttributeModel> {
    return attributes.map((attribute) => converters.attribute(attribute));
  }

  protected convertInputs(inputs: ReadonlyArray<Input>): ReadonlyArray<InputModel> {
    return inputs.map((input) => converters.input(input));
  }

  protected convertOutputs(outputs: ReadonlyArray<Output>): ReadonlyArray<OutputModel> {
    return outputs.map((output) => converters.output(output));
  }

  protected convertWitness(script: Witness): WitnessModel {
    return converters.witness(script);
  }

  protected async capture<T>(
    func: (monitor?: Monitor) => Promise<T>,
    {
      name,
      labels = {},
      metric,
    }: {
      readonly name: string;
      readonly labels?: Labels;
      readonly metric?: {
        readonly total: Histogram;
        readonly error: Counter;
      };
    },
    monitor?: Monitor,
  ): Promise<T> {
    if (monitor === undefined) {
      return func();
    }

    return monitor
      .at('local_user_account_provider')
      .withLabels(labels)
      .captureSpanLog(func, {
        name,
        metric,
        level: { log: 'verbose', span: 'info' },
        trace: true,
      });
  }
}
