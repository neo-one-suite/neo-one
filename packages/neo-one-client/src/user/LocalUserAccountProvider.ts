import {
  ABI,
  AssetType as CoreAssetType,
  Attribute as AttributeModel,
  AttributeUsage,
  bigNumberToBN,
  ClaimTransaction,
  common,
  Contract as ContractModel,
  ContractParameterType as CoreContractParameterType,
  ContractTransaction,
  crypto,
  getContractProperties,
  Input as InputModel,
  InvocationTransaction as InvocationTransactionModel,
  IssueTransaction,
  Output as OutputModel,
  ScriptBuilder,
  ScriptBuilderParam,
  Transaction as TransactionModel,
  UInt160Attribute,
  utils,
  Witness as WitnessModel,
} from '@neo-one/client-core';
import { processActionsAndMessage, processConsoleLogMessages } from '@neo-one/client-switch';
import { Counter, Histogram, Labels, metrics, Monitor } from '@neo-one/monitor';
import { labels as labelNames, utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { Observable } from 'rxjs';
import {
  FundsInUseError,
  InsufficientFundsError,
  InvalidTransactionError,
  InvokeError,
  NoAccountError,
  NothingToClaimError,
  NothingToIssueError,
  NothingToTransferError,
} from '../errors';
import { addressToScriptHash } from '../helpers';
import { convertParams } from '../sc/common';
import {
  AddressString,
  AssetRegister,
  AssetType,
  Attribute,
  BufferString,
  Contract,
  ContractParameterType,
  ContractRegister,
  DataProvider,
  GetOptions,
  Hash256String,
  Input,
  InputOutput,
  InvocationResultError,
  InvocationResultSuccess,
  InvocationTransaction,
  InvokeTransactionOptions,
  NetworkSettings,
  NetworkType,
  Output,
  Param,
  ParamJSON,
  PublishReceipt,
  RawCallReceipt,
  RawInvocationData,
  RawInvocationResultError,
  RawInvocationResultSuccess,
  RawInvokeReceipt,
  RegisterAssetReceipt,
  SourceMaps,
  Transaction,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UpdateAccountNameOptions,
  UserAccount,
  UserAccountID,
  UserAccountProvider,
  Witness,
} from '../types';
import * as clientUtils from '../utils';
import { converters } from './converters';

export interface KeyStore {
  readonly type: string;
  readonly byteLimit?: number;
  readonly currentAccount$: Observable<UserAccount | undefined>;
  readonly getCurrentAccount: () => UserAccount | undefined;
  readonly accounts$: Observable<ReadonlyArray<UserAccount>>;
  readonly getAccounts: () => ReadonlyArray<UserAccount>;
  readonly selectAccount: (id?: UserAccountID, monitor?: Monitor) => Promise<void>;
  readonly deleteAccount: (id: UserAccountID, monitor?: Monitor) => Promise<void>;
  readonly updateAccountName: (options: UpdateAccountNameOptions) => Promise<void>;
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
  readonly relayTransaction: (network: NetworkType, transaction: string, monitor?: Monitor) => Promise<Transaction>;
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
  readonly getNetworkSettings: (network: NetworkType, monitor?: Monitor) => Promise<NetworkSettings>;
  readonly getBlockCount: (network: NetworkType, monitor?: Monitor) => Promise<number>;
  readonly read: (network: NetworkType) => DataProvider;
}

interface TransactionOptionsFull {
  readonly from: UserAccountID;
  readonly attributes: ReadonlyArray<Attribute>;
  readonly networkFee: BigNumber;
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

const toContractParameterType = (parameter: ContractParameterType): CoreContractParameterType => {
  switch (parameter) {
    case 'Signature':
      return CoreContractParameterType.Signature;
    case 'Boolean':
      return CoreContractParameterType.Boolean;
    case 'Integer':
      return CoreContractParameterType.Integer;
    case 'Address':
      return CoreContractParameterType.Hash160;
    case 'Hash256':
      return CoreContractParameterType.Hash256;
    case 'Buffer':
      return CoreContractParameterType.ByteArray;
    case 'PublicKey':
      return CoreContractParameterType.PublicKey;
    case 'String':
      return CoreContractParameterType.String;
    case 'Array':
      return CoreContractParameterType.Array;
    case 'InteropInterface':
      return CoreContractParameterType.InteropInterface;
    case 'Void':
      return CoreContractParameterType.Void;
    default:
      /* istanbul ignore next */
      commonUtils.assertNever(parameter);
      /* istanbul ignore next */
      throw new Error('For TS');
  }
};

const toAssetType = (assetType: AssetType): CoreAssetType => {
  switch (assetType) {
    case 'Credit':
      return CoreAssetType.CreditFlag;
    case 'Duty':
      return CoreAssetType.DutyFlag;
    case 'Governing':
      return CoreAssetType.GoverningToken;
    case 'Utility':
      return CoreAssetType.UtilityToken;
    case 'Currency':
      return CoreAssetType.Currency;
    case 'Share':
      return CoreAssetType.Share;
    case 'Invoice':
      return CoreAssetType.Invoice;
    case 'Token':
      return CoreAssetType.Token;
    default:
      /* istanbul ignore next */
      commonUtils.assertNever(assetType);
      /* istanbul ignore next */
      throw new Error('For TS');
  }
};

export class LocalUserAccountProvider<TKeyStore extends KeyStore, TProvider extends Provider>
  implements UserAccountProvider {
  public readonly type: string;
  public readonly currentAccount$: Observable<UserAccount | undefined>;
  public readonly accounts$: Observable<ReadonlyArray<UserAccount>>;
  public readonly networks$: Observable<ReadonlyArray<NetworkType>>;
  public readonly keystore: TKeyStore;
  public readonly provider: TProvider;
  private readonly mutableUsedOutputs: Set<string>;
  private mutableBlockCount: number;

  public constructor({ keystore, provider }: { readonly keystore: TKeyStore; readonly provider: TProvider }) {
    this.type = keystore.type;
    this.keystore = keystore;
    this.provider = provider;

    this.currentAccount$ = keystore.currentAccount$;
    this.accounts$ = keystore.accounts$;
    this.networks$ = provider.networks$;

    this.mutableBlockCount = 0;
    this.mutableUsedOutputs = new Set<string>();
  }

  public getCurrentAccount(): UserAccount | undefined {
    return this.keystore.getCurrentAccount();
  }

  public getAccounts(): ReadonlyArray<UserAccount> {
    return this.keystore.getAccounts();
  }

  public getNetworks(): ReadonlyArray<NetworkType> {
    return this.provider.getNetworks();
  }

  public async transfer(transfers: ReadonlyArray<Transfer>, options?: TransactionOptions): Promise<TransactionResult> {
    const { from, attributes, networkFee, monitor } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        const { inputs, outputs } = await this.getTransfersInputOutputs({
          transfers,
          from,
          gas: networkFee,
          monitor: span,
        });

        if (inputs.length === 0 && this.keystore.byteLimit === undefined) {
          throw new NothingToTransferError();
        }

        const transaction = new ContractTransaction({
          inputs: this.convertInputs(inputs),
          outputs: this.convertOutputs(outputs),
          attributes: this.convertAttributes(attributes),
        });

        return this.sendTransaction({
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

  public async claim(options?: TransactionOptions): Promise<TransactionResult> {
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

        const transaction = new ClaimTransaction({
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

        return this.sendTransaction({
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

  public async publish(
    contract: ContractRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt>> {
    return this.publishBase(
      'publish',
      contract,
      () => {
        // do nothing,
      },
      undefined,
      options,
    );
  }

  public async publishAndDeploy(
    contract: ContractRegister,
    abi: ABI,
    params: ReadonlyArray<Param>,
    options?: TransactionOptions,
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<PublishReceipt>> {
    return this.publishBase(
      'publish',
      contract,
      (sb) => {
        const deployFunc = abi.functions.find((func) => func.name === 'deploy');
        if (deployFunc !== undefined) {
          // []
          sb.emitOp('DROP');
          const hash = crypto.toScriptHash(Buffer.from(contract.script, 'hex'));
          sb.emitAppCall(
            hash,
            'deploy',
            ...convertParams({ parameters: deployFunc.parameters === undefined ? [] : deployFunc.parameters, params })
              .converted,
          );
          sb.emitOp('THROWIFNOT');
        }
      },
      sourceMaps,
      options,
    );
  }

  public async registerAsset(
    asset: AssetRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<RegisterAssetReceipt>> {
    const sb = new ScriptBuilder();

    sb.emitSysCall(
      'Neo.Asset.Create',
      toAssetType(asset.type),
      asset.name,
      bigNumberToBN(asset.amount, 8),
      asset.precision,
      common.stringToECPoint(asset.owner),
      common.stringToUInt160(addressToScriptHash(asset.admin)),
      common.stringToUInt160(addressToScriptHash(asset.issuer)),
    );

    return this.invokeRaw({
      script: sb.build(),
      options,
      onConfirm: async ({ receipt, data }): Promise<RegisterAssetReceipt> => {
        let result;
        if (data.result.state === 'FAULT') {
          result = await this.getInvocationResultError(data, data.result);
        } else {
          const createdAsset = data.asset;
          if (createdAsset === undefined) {
            /* istanbul ignore next */
            throw new InvalidTransactionError(
              'Something went wrong! Expected a asset to have been created, but none was found',
            );
          }

          result = await this.getInvocationResultSuccess(data, data.result, createdAsset);
        }

        return {
          blockIndex: receipt.blockIndex,
          blockHash: receipt.blockHash,
          transactionIndex: receipt.transactionIndex,
          result,
        };
      },
      method: 'registerAsset',
    });
  }

  public async issue(transfers: ReadonlyArray<Transfer>, options?: TransactionOptions): Promise<TransactionResult> {
    const { from, attributes, networkFee, monitor } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        if (transfers.length === 0) {
          throw new NothingToIssueError();
        }

        const settings = await this.provider.getNetworkSettings(from.network, span);
        const { inputs, outputs } = await this.getTransfersInputOutputs({
          transfers: [],
          from,
          gas: networkFee.plus(settings.issueGASFee),
          monitor: span,
        });

        const issueOutputs = outputs.concat(
          transfers.map((transfer) => ({
            address: transfer.to,
            asset: transfer.asset,
            value: transfer.amount,
          })),
        );

        const transaction = new IssueTransaction({
          inputs: this.convertInputs(inputs),
          outputs: this.convertOutputs(issueOutputs),
          attributes: this.convertAttributes(attributes),
        });

        return this.sendTransaction({
          inputs,
          from,
          transaction,
          onConfirm: async ({ receipt }) => receipt,
          monitor: span,
        });
      },
      {
        name: 'neo_issue',
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
    options: InvokeTransactionOptions = {},
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<RawInvokeReceipt>> {
    const { attributes = [] } = options;

    return this.invokeRaw({
      script: clientUtils.getInvokeMethodScript({
        address: contract,
        method,
        params,
      }),
      options: {
        from: options.from,
        attributes: attributes.concat(
          [
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
          ].filter(commonUtils.notNull),
        ),
        networkFee: options.networkFee,
        transfers: options.transfers,
      },
      onConfirm: ({ receipt, data }): RawInvokeReceipt => ({
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.transactionIndex,
        result: data.result,
        actions: data.actions,
      }),
      scripts: [
        verify
          ? new WitnessModel({
              invocation: clientUtils.getInvokeMethodInvocationScript({
                method,
                params,
              }),

              verification: Buffer.alloc(0, 0),
            })
          : undefined,
      ].filter(commonUtils.notNull),
      method: 'invoke',
      labels: {
        [labelNames.INVOKE_METHOD]: method,
      },
      sourceMaps,
    });
  }

  public async call(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    options: TransactionOptions = {},
  ): Promise<RawCallReceipt> {
    const { from, attributes, networkFee, monitor } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        const { inputs, outputs } = await this.getTransfersInputOutputs({
          transfers: [],
          from,
          gas: networkFee,
          monitor: span,
        });

        const testTransaction = new InvocationTransactionModel({
          version: 1,
          inputs: this.convertInputs(inputs),
          outputs: this.convertOutputs(outputs),
          attributes: this.convertAttributes(attributes),
          gas: common.TEN_THOUSAND_FIXED8,
          script: clientUtils.getInvokeMethodScript({
            address: contract,
            method,
            params,
          }),
        });

        return this.provider.testInvoke(from.network, testTransaction.serializeWire().toString('hex'), span);
      },
      {
        name: 'neo_call',
        labels: {
          [labelNames.CALL_METHOD]: method,
        },
      },

      monitor,
    );
  }

  public async selectAccount(id?: UserAccountID, monitor?: Monitor): Promise<void> {
    await this.keystore.selectAccount(id, monitor);
  }

  public async deleteAccount(id: UserAccountID, monitor?: Monitor): Promise<void> {
    await this.keystore.deleteAccount(id, monitor);
  }

  public async updateAccountName(options: UpdateAccountNameOptions): Promise<void> {
    await this.keystore.updateAccountName(options);
  }

  public read(network: NetworkType): DataProvider {
    return this.provider.read(network);
  }

  public async __execute(
    script: BufferString,
    options?: InvokeTransactionOptions,
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    return this.invokeRaw({
      script: Buffer.from(script, 'hex'),
      options,
      onConfirm: ({ receipt, data }): RawInvokeReceipt => ({
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.transactionIndex,
        result: data.result,
        actions: data.actions,
      }),
      method: 'execute',
      sourceMaps,
    });
  }

  private getTransactionOptions(options: TransactionOptions | InvokeTransactionOptions = {}): TransactionOptionsFull {
    const { attributes = [], networkFee = utils.ZERO_BIG_NUMBER } = options;

    const { from: fromIn } = options;
    let from = fromIn;
    if (from === undefined) {
      const fromAccount = this.getCurrentAccount();
      if (fromAccount === undefined) {
        throw new NoAccountError();
      }
      from = fromAccount.id;
    }

    return {
      from,
      attributes: attributes.concat([NEO_ONE_ATTRIBUTE]),
      networkFee,
      monitor: options.monitor,
    };
  }

  private async getInvocationResultError(
    data: RawInvocationData,
    result: RawInvocationResultError,
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<InvocationResultError> {
    const message = await processActionsAndMessage({
      actions: data.actions,
      message: result.message,
      sourceMaps,
    });

    return {
      state: result.state,
      gasConsumed: result.gasConsumed,
      gasCost: result.gasCost,
      message,
    };
  }

  private async getInvocationResultSuccess<T>(
    data: RawInvocationData,
    result: RawInvocationResultSuccess,
    value: T,
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<InvocationResultSuccess<T>> {
    await processConsoleLogMessages({
      actions: data.actions,
      sourceMaps,
    });

    return {
      state: result.state,
      gasConsumed: result.gasConsumed,
      gasCost: result.gasCost,
      value,
    };
  }

  private async publishBase(
    method: string,
    contractIn: ContractRegister,
    emit: (sb: ScriptBuilder) => void,
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
    options?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt>> {
    const contract = new ContractModel({
      script: Buffer.from(contractIn.script, 'hex'),
      parameterList: contractIn.parameters.map(toContractParameterType),
      returnType: toContractParameterType(contractIn.returnType),
      name: contractIn.name,
      codeVersion: contractIn.codeVersion,
      author: contractIn.author,
      email: contractIn.email,
      description: contractIn.description,
      contractProperties: getContractProperties({
        hasDynamicInvoke: contractIn.dynamicInvoke,
        hasStorage: contractIn.storage,
        payable: contractIn.payable,
      }),
    });

    const sb = new ScriptBuilder();
    sb.emitSysCall(
      'Neo.Contract.Create',
      contract.script,
      Buffer.from([...contract.parameterList]),
      contract.returnType,
      contract.contractProperties,
      contract.name,
      contract.codeVersion,
      contract.author,
      contract.email,
      contract.description,
    );
    emit(sb);

    return this.invokeRaw({
      script: sb.build(),
      options,
      onConfirm: async ({ receipt, data }): Promise<PublishReceipt> => {
        let result;
        if (data.result.state === 'FAULT') {
          result = await this.getInvocationResultError(data, data.result, sourceMaps);
        } else {
          const createdContract = data.contracts[0] as Contract | undefined;
          if (createdContract === undefined) {
            /* istanbul ignore next */
            throw new InvalidTransactionError(
              'Something went wrong! Expected a contract to have been created, but none was found',
            );
          }

          result = await this.getInvocationResultSuccess(data, data.result, createdContract, sourceMaps);
        }

        return {
          blockIndex: receipt.blockIndex,
          blockHash: receipt.blockHash,
          transactionIndex: receipt.transactionIndex,
          result,
        };
      },
      method,
    });
  }

  private async invokeRaw<T extends TransactionReceipt>({
    script,
    options = {},
    onConfirm,
    method,
    scripts = [],
    labels = {},
    sourceMaps,
  }: {
    readonly script: Buffer;
    readonly options?: TransactionOptions | InvokeTransactionOptions;
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
    readonly sourceMaps?: Promise<SourceMaps>;
  }): Promise<TransactionResult<T, InvocationTransaction>> {
    const { from, attributes: attributesIn, networkFee, monitor } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        const transfersIn = (options as InvokeTransactionOptions).transfers;
        const transfers = transfersIn === undefined ? [] : transfersIn;
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
          inputs: this.convertInputs(testInputs),
          outputs: this.convertOutputs(testOutputs),
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
        const { inputs, outputs } = await this.getTransfersInputOutputs({
          transfers,
          from,
          gas: networkFee.plus(gas),
          monitor: span,
        });

        const invokeTransaction = new InvocationTransactionModel({
          version: 1,
          inputs: this.convertInputs(inputs),
          outputs: this.convertOutputs(outputs),
          attributes: this.convertAttributes(attributes),
          gas: bigNumberToBN(gas, 8),
          script,
          scripts,
        });

        try {
          // tslint:disable-next-line prefer-immediate-return
          const result = await this.sendTransaction<T, InvocationTransaction>({
            from,
            inputs,
            transaction: invokeTransaction,
            onConfirm: async ({ transaction, receipt }) => {
              const data = await this.provider.getInvocationData(from.network, transaction.hash);

              return onConfirm({ transaction, receipt, data });
            },
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

  private async sendTransaction<T extends TransactionReceipt, TTransaction extends Transaction = Transaction>({
    inputs,
    transaction: transactionUnsignedIn,
    from,
    onConfirm,
    monitor,
  }: {
    readonly inputs: ReadonlyArray<InputOutput>;
    readonly transaction: TransactionModel;
    readonly from: UserAccountID;
    readonly onConfirm: (
      options: {
        readonly transaction: Transaction;
        readonly receipt: TransactionReceipt;
      },
    ) => Promise<T>;
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

        const witness = await this.keystore.sign({
          account: from,
          message: transactionUnsigned.serializeUnsigned().toString('hex'),
          monitor: span,
        });

        const transaction = await this.provider.relayTransaction(
          from.network,
          this.addWitness({
            transaction: transactionUnsigned,
            address,
            witness: this.convertWitness(witness),
          })
            .serializeWire()
            .toString('hex'),
          span,
        );

        transactionUnsigned.inputs.forEach((transfer) =>
          this.mutableUsedOutputs.add(`${common.uInt256ToString(transfer.hash)}:${transfer.index}`),
        );

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

  private async consolidate({
    inputs,
    transactionUnsignedIn,
    from,
    monitor,
    byteLimit,
  }: {
    readonly transactionUnsignedIn: TransactionModel;
    readonly inputs: ReadonlyArray<InputOutput>;
    readonly from: UserAccountID;
    readonly monitor?: Monitor;
    readonly byteLimit: number;
  }): Promise<TransactionModel> {
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
                bigNumberToBN(tempIns.reduce((left, right) => left.plus(right.value), new BigNumber('0')), 8),
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
  private addWitness({
    transaction,
    address,
    witness,
  }: {
    readonly transaction: TransactionModel;
    readonly address: AddressString;
    readonly witness: WitnessModel;
  }): TransactionModel {
    const scriptAttributes = transaction.attributes.filter(
      (attribute): attribute is UInt160Attribute => attribute.usage === AttributeUsage.Script,
    );
    const scriptHash = addressToScriptHash(address);
    const scriptHashes = scriptAttributes.map((attribute) => common.uInt160ToString(attribute.value));

    if (scriptHashes.length === 2 || (scriptHashes.length === 1 && scriptHashes[0] !== scriptHash)) {
      let otherHash = scriptHashes[0];
      if (scriptHashes.length === 2) {
        const [first, second] = scriptHashes;
        if (!(first === scriptHash || second === scriptHash)) {
          throw new InvalidTransactionError('Something went wrong!');
        }

        otherHash = first === scriptHash ? second : first;
      }

      if (transaction.scripts.length !== 1) {
        throw new InvalidTransactionError('Something went wrong!');
      }

      const otherScript = transaction.scripts[0];

      return transaction.clone({
        scripts: _.sortBy<[string, WitnessModel]>(
          [[scriptHash, witness], [otherHash, otherScript]],
          (value) => value[0],
        ).map((value) => value[1]),
      });
    }

    if (scriptHashes.length === 0 || (scriptHashes.length === 1 && scriptHashes[0] === scriptHash)) {
      if (transaction.scripts.length !== 0) {
        throw new InvalidTransactionError('Something went wrong!');
      }

      return transaction.clone({ scripts: [witness] });
    }

    throw new InvalidTransactionError('Something went wrong!');
  }

  private async getUnspentOutputs({
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

  private async getTransfersInputOutputs({
    from,
    transfers,
    gas,
    monitor,
  }: {
    readonly from: UserAccountID;
    readonly transfers: ReadonlyArray<Transfer>;
    readonly gas: BigNumber;
    readonly monitor?: Monitor;
  }): Promise<{ readonly outputs: ReadonlyArray<Output>; readonly inputs: ReadonlyArray<InputOutput> }> {
    if (transfers.length === 0 && gas.lte(utils.ZERO_BIG_NUMBER)) {
      return { inputs: [], outputs: [] };
    }
    const { unspentOutputs: allOutputs, wasFiltered } = await this.getUnspentOutputs({ from, monitor });

    return Object.values(
      _.groupBy(
        gas.isEqualTo(utils.ZERO_BIG_NUMBER)
          ? transfers
          : transfers.concat([
              {
                amount: gas,
                asset: common.GAS_ASSET_HASH,
                // tslint:disable-next-line no-any
              } as any,
            ]),
        ({ asset }) => asset,
      ),
    ).reduce(
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

  private getTransferInputOutputs({
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

  private getInvokeAttributeTag(
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

  private paramToJSON(param: Param): ParamJSON | undefined {
    if (param === undefined) {
      return param;
    }

    if (Array.isArray(param)) {
      return param.map((value) => this.paramToJSON(value));
    }

    if (BigNumber.isBigNumber(param) || param instanceof BigNumber) {
      return param.toString();
    }

    return param;
  }

  private convertAttributes(attributes: ReadonlyArray<Attribute>): ReadonlyArray<AttributeModel> {
    return attributes.map((attribute) => converters.attribute(attribute));
  }

  private convertInputs(inputs: ReadonlyArray<Input>): ReadonlyArray<InputModel> {
    return inputs.map((input) => converters.input(input));
  }

  private convertOutputs(outputs: ReadonlyArray<Output>): ReadonlyArray<OutputModel> {
    return outputs.map((output) => converters.output(output));
  }

  private convertWitness(script: Witness): WitnessModel {
    return converters.witness(script);
  }

  private async capture<T>(
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
