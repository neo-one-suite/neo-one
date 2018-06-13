import {
  assertAssetTypeJSON,
  assertContractParameterTypeJSON,
  Attribute as AttributeModel,
  AttributeUsage,
  ClaimTransaction,
  common,
  Contract as ContractModel,
  ContractTransaction,
  getContractProperties,
  Input as InputModel,
  InvocationTransaction,
  IssueTransaction,
  Output as OutputModel,
  Param as ScriptBuilderParam,
  ScriptBuilder,
  toAssetType,
  toContractParameterType,
  Transaction as TransactionModel,
  UInt160Attribute,
  utils,
  Witness as WitnessModel,
} from '@neo-one/client-core';
import { Counter, Histogram, Labels, metrics, Monitor } from '@neo-one/monitor';
import { labels as labelNames, utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { Observable } from 'rxjs';
import {
  InsufficientFundsError,
  InvalidTransactionError,
  InvokeError,
  NoAccountError,
  NothingToClaimError,
  NothingToIssueError,
  NothingToTransferError,
} from '../errors';
import { addressToScriptHash } from '../helpers';
import {
  AddressString,
  AssetRegister,
  Attribute,
  ContractRegister,
  DataProvider,
  GetOptions,
  Hash160String,
  Hash256String,
  Input,
  InvocationResultError,
  InvocationResultSuccess,
  InvokeReceiptInternal,
  InvokeTransactionOptions,
  NetworkSettings,
  NetworkType,
  Output,
  Param,
  ParamJSON,
  PublishReceipt,
  RawInvocationData,
  RawInvocationResult,
  RawInvocationResultError,
  RawInvocationResultSuccess,
  RegisterAssetReceipt,
  Transaction,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UnspentOutput,
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
  readonly currentAccount$: Observable<UserAccount | null>;
  readonly getCurrentAccount: () => UserAccount | null;
  readonly accounts$: Observable<UserAccount[]>;
  readonly getAccounts: () => UserAccount[];
  readonly selectAccount: (
    id?: UserAccountID,
    monitor?: Monitor,
  ) => Promise<void>;
  readonly deleteAccount: (
    id: UserAccountID,
    monitor?: Monitor,
  ) => Promise<void>;
  readonly updateAccountName: (
    options: UpdateAccountNameOptions,
  ) => Promise<void>;
  readonly sign: (
    options: {
      account: UserAccountID;
      message: string;
      monitor?: Monitor;
    },
  ) => Promise<Witness>;
}

export interface Provider {
  readonly networks$: Observable<NetworkType[]>;
  readonly getNetworks: () => NetworkType[];
  readonly getUnclaimed: (
    network: NetworkType,
    address: AddressString,
    monitor?: Monitor,
  ) => Promise<{ unclaimed: Input[]; amount: BigNumber }>;
  readonly getUnspentOutputs: (
    network: NetworkType,
    address: AddressString,
    monitor?: Monitor,
  ) => Promise<UnspentOutput[]>;
  readonly relayTransaction: (
    network: NetworkType,
    transaction: string,
    monitor?: Monitor,
  ) => Promise<Transaction>;
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
  readonly testInvoke: (
    network: NetworkType,
    transaction: string,
    monitor?: Monitor,
  ) => Promise<RawInvocationResult>;
  readonly getNetworkSettings: (
    network: NetworkType,
    monitor?: Monitor,
  ) => Promise<NetworkSettings>;
  readonly read: (network: NetworkType) => DataProvider;
}

interface TransactionOptionsFull {
  from: UserAccountID;
  attributes: Attribute[];
  networkFee: BigNumber;
  monitor?: Monitor;
}

const NEO_ONE_ATTRIBUTE = {
  usage: 'Remark15',
  data: Buffer.from('neo-one', 'utf8').toString('hex'),
} as Attribute;

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

export class LocalUserAccountProvider<
  TKeyStore extends KeyStore,
  TProvider extends Provider
> implements UserAccountProvider {
  public readonly type: string;
  public readonly currentAccount$: Observable<UserAccount | null>;
  public readonly accounts$: Observable<UserAccount[]>;
  public readonly networks$: Observable<NetworkType[]>;
  public readonly keystore: TKeyStore;
  public readonly provider: TProvider;

  constructor({
    keystore,
    provider,
  }: {
    keystore: TKeyStore;
    provider: TProvider;
  }) {
    this.type = keystore.type;
    this.keystore = keystore;
    this.provider = provider;

    this.currentAccount$ = keystore.currentAccount$;
    this.accounts$ = keystore.accounts$;
    this.networks$ = provider.networks$;
  }

  public getCurrentAccount(): UserAccount | null {
    return this.keystore.getCurrentAccount();
  }

  public getAccounts(): UserAccount[] {
    return this.keystore.getAccounts();
  }

  public getNetworks(): NetworkType[] {
    return this.provider.getNetworks();
  }

  public async transfer(
    transfers: Transfer[],
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>> {
    const {
      from,
      attributes,
      networkFee,
      monitor,
    } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        const { inputs, outputs } = await this.getTransfersInputOutputs({
          transfers,
          from,
          gas: networkFee,
          monitor: span,
        });

        if (inputs.length === 0) {
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

  public async claim(
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>> {
    const {
      from,
      attributes,
      networkFee,
      monitor,
    } = this.getTransactionOptions(options);

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
          throw new NothingToClaimError();
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

  public publish(
    contractIn: ContractRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt>> {
    const contract = new ContractModel({
      script: Buffer.from(contractIn.script, 'hex'),
      parameterList: contractIn.parameters.map((parameter) =>
        toContractParameterType(assertContractParameterTypeJSON(parameter)),
      ),

      returnType: toContractParameterType(
        assertContractParameterTypeJSON(contractIn.returnType),
      ),

      name: contractIn.name,
      codeVersion: contractIn.codeVersion,
      author: contractIn.author,
      email: contractIn.email,
      description: contractIn.description,
      contractProperties: getContractProperties({
        hasDynamicInvoke: contractIn.properties.dynamicInvoke,
        hasStorage: contractIn.properties.storage,
        payable: contractIn.properties.payable,
      }),
    });

    const sb = new ScriptBuilder();
    sb.emitSysCall(
      'Neo.Contract.Create',
      contract.script,
      Buffer.from(contract.parameterList),
      contract.returnType,
      contract.contractProperties,
      contract.name,
      contract.codeVersion,
      contract.author,
      contract.email,
      contract.description,
    );

    return this.invokeRaw({
      script: sb.build(),
      options,
      onConfirm: ({ receipt, data }): PublishReceipt => {
        let result;
        if (data.result.state === 'FAULT') {
          result = this.getInvocationResultError(data.result);
        } else {
          const [createdContract] = data.contracts;
          if (createdContract == null) {
            throw new InvalidTransactionError(
              'Something went wrong! Expected a contract to have been created, ' +
                'but none was found',
            );
          }

          result = this.getInvocationResultSuccess(
            data.result,
            createdContract,
          );
        }

        return {
          blockIndex: receipt.blockIndex,
          blockHash: receipt.blockHash,
          transactionIndex: receipt.transactionIndex,
          result,
        };
      },
      method: 'publish',
    });
  }

  public registerAsset(
    asset: AssetRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<RegisterAssetReceipt>> {
    const sb = new ScriptBuilder();

    sb.emitSysCall(
      'Neo.Asset.Create',
      toAssetType(assertAssetTypeJSON(asset.assetType)),
      asset.name,
      clientUtils.bigNumberToBN(asset.amount, 8),
      asset.precision,
      common.stringToECPoint(asset.owner),
      common.stringToUInt160(addressToScriptHash(asset.admin)),
      common.stringToUInt160(addressToScriptHash(asset.issuer)),
    );

    return this.invokeRaw({
      script: sb.build(),
      options,
      onConfirm: ({ receipt, data }): RegisterAssetReceipt => {
        let result;
        if (data.result.state === 'FAULT') {
          result = this.getInvocationResultError(data.result);
        } else {
          const createdAsset = data.asset;
          if (createdAsset == null) {
            throw new InvalidTransactionError(
              'Something went wrong! Expected a asset to have been created, ' +
                'but none was found',
            );
          }

          result = this.getInvocationResultSuccess(data.result, createdAsset);
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

  public async issue(
    transfers: Transfer[],
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>> {
    const {
      from,
      attributes,
      networkFee,
      monitor,
    } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        const settings = await this.provider.getNetworkSettings(
          from.network,
          span,
        );

        const { inputs, outputs } = await this.getTransfersInputOutputs({
          transfers: [],
          from,
          gas: networkFee.plus(settings.issueGASFee),
          monitor: span,
        });

        if (inputs.length === 0) {
          throw new NothingToIssueError();
        }

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

  public invoke(
    contract: Hash160String,
    method: string,
    params: Array<ScriptBuilderParam | null>,
    paramsZipped: Array<[string, Param | null]>,
    verify: boolean,
    optionsIn?: InvokeTransactionOptions,
  ): Promise<TransactionResult<InvokeReceiptInternal>> {
    const options = optionsIn || {};
    return this.invokeRaw({
      script: clientUtils.getInvokeMethodScript({
        hash: contract,
        method,
        params,
      }),

      options: {
        from: options.from,
        attributes: (options.attributes || []).concat(
          [
            {
              usage: 'Remark14',
              data: Buffer.from(
                `neo-one-invoke:${this.getInvokeAttributeTag(
                  contract,
                  method,
                  paramsZipped,
                )}`,
                'utf8',
              ).toString('hex'),
            },
            verify
              ? ({
                  usage: 'Script',
                  data: contract,
                } as any)
              : null,
          ].filter(commonUtils.notNull),
        ),
        networkFee: options.networkFee,
        transfers: options.transfers,
      },
      onConfirm: ({ receipt, data }): InvokeReceiptInternal => ({
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
          : null,
      ].filter(commonUtils.notNull),
      method: 'invoke',
      labels: {
        [labelNames.INVOKE_METHOD]: method,
      },
    });
  }

  public call(
    contract: Hash160String,
    method: string,
    params: Array<ScriptBuilderParam | null>,
    options: TransactionOptions = {},
  ): Promise<RawInvocationResult> {
    const {
      from,
      attributes,
      networkFee,
      monitor,
    } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        const { inputs, outputs } = await this.getTransfersInputOutputs({
          transfers: [],
          from,
          gas: networkFee,
          monitor: span,
        });

        const testTransaction = new InvocationTransaction({
          version: 1,
          inputs: this.convertInputs(inputs),
          outputs: this.convertOutputs(outputs),
          attributes: this.convertAttributes(attributes),
          gas: common.TEN_THOUSAND_FIXED8,
          script: clientUtils.getInvokeMethodScript({
            hash: contract,
            method,
            params,
          }),
        });

        return this.provider.testInvoke(
          from.network,
          testTransaction.serializeWire().toString('hex'),
          span,
        );
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

  public async selectAccount(
    id?: UserAccountID,
    monitor?: Monitor,
  ): Promise<void> {
    await this.keystore.selectAccount(id, monitor);
  }

  public async deleteAccount(
    id: UserAccountID,
    monitor?: Monitor,
  ): Promise<void> {
    await this.keystore.deleteAccount(id, monitor);
  }

  public async updateAccountName(
    options: UpdateAccountNameOptions,
  ): Promise<void> {
    await this.keystore.updateAccountName(options);
  }

  public read(network: NetworkType): DataProvider {
    return this.provider.read(network);
  }

  private getTransactionOptions(
    optionsIn?: TransactionOptions | InvokeTransactionOptions,
  ): TransactionOptionsFull {
    const options = optionsIn || {};
    // $FlowFixMe
    const attributes = options.attributes || ([] as Attribute[]);

    const { from: fromIn } = options;
    let from = fromIn;
    if (from == null) {
      const fromAccount = this.getCurrentAccount();
      if (fromAccount == null) {
        throw new NoAccountError();
      }
      from = fromAccount.id;
    }

    return {
      from,
      attributes: attributes.concat(NEO_ONE_ATTRIBUTE),
      networkFee: options.networkFee || utils.ZERO_BIG_NUMBER,
      monitor: options.monitor,
    };
  }

  private getInvocationResultError(
    result: RawInvocationResultError,
  ): InvocationResultError {
    return {
      state: result.state,
      gasConsumed: result.gasConsumed,
      gasCost: result.gasCost,
      message: result.message,
    };
  }

  private getInvocationResultSuccess<T>(
    result: RawInvocationResultSuccess,
    value: T,
  ): InvocationResultSuccess<T> {
    return {
      state: result.state,
      gasConsumed: result.gasConsumed,
      gasCost: result.gasCost,
      value,
    };
  }

  private async invokeRaw<T>({
    script,
    options = {},
    onConfirm,
    method,
    scripts: scriptsIn,
    labels,
  }: {
    script: Buffer;
    options?: TransactionOptions | InvokeTransactionOptions;
    onConfirm: (
      options: {
        transaction: Transaction;
        data: RawInvocationData;
        receipt: TransactionReceipt;
      },
    ) => Promise<T> | T;
    method: string;
    scripts?: WitnessModel[];
    labels?: Labels;
  }): Promise<TransactionResult<T>> {
    const {
      from,
      attributes: attributesIn,
      networkFee,
      monitor,
    } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        const transfers = (options as any).transfers || [];
        const {
          inputs: testInputs,
          outputs: testOutputs,
        } = await this.getTransfersInputOutputs({
          transfers,
          from,
          gas: networkFee,
          monitor: span,
        });

        const attributes = attributesIn.concat({
          usage: 'Remark15',
          data: Buffer.from(`${utils.randomUInt()}`, 'utf8').toString('hex'),
        });

        const scripts = scriptsIn || [];

        const testTransaction = new InvocationTransaction({
          version: 1,
          inputs: this.convertInputs(testInputs),
          outputs: this.convertOutputs(testOutputs),
          attributes: this.convertAttributes(attributes),
          gas: common.TEN_THOUSAND_FIXED8,
          script,
          scripts,
        });

        const result = await this.provider.testInvoke(
          from.network,
          testTransaction.serializeWire().toString('hex'),
          span,
        );

        if (result.state === 'FAULT') {
          throw new InvokeError(result.message);
        }

        const gas = result.gasConsumed.integerValue(BigNumber.ROUND_UP);
        const { inputs, outputs } = await this.getTransfersInputOutputs({
          transfers,
          from,
          gas: networkFee.plus(gas),
          monitor: span,
        });

        const invokeTransaction = new InvocationTransaction({
          version: 1,
          inputs: this.convertInputs(inputs),
          outputs: this.convertOutputs(outputs),
          attributes: this.convertAttributes(attributes),
          gas: clientUtils.bigNumberToBN(gas, 8),
          script,
          scripts,
        });

        return this.sendTransaction({
          from,
          transaction: invokeTransaction,
          onConfirm: async ({ transaction, receipt }) => {
            const data = await this.provider.getInvocationData(
              from.network,
              transaction.txid,
            );

            const res = await onConfirm({ transaction, receipt, data });
            return res;
          },
          monitor: span,
        });
      },
      {
        name: 'neo_invoke_raw',
        labels: {
          ...(labels || {}),
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

  private sendTransaction<T>({
    transaction: transactionUnsignedIn,
    from,
    onConfirm,
    monitor,
  }: {
    transaction: TransactionModel;
    from: UserAccountID;
    onConfirm: (
      options: {
        transaction: Transaction;
        receipt: TransactionReceipt;
      },
    ) => Promise<T>;
    monitor?: Monitor;
  }): Promise<TransactionResult<T>> {
    return this.capture(
      async (span) => {
        let transactionUnsigned = transactionUnsignedIn;
        const scriptHash = addressToScriptHash(from.address);
        if (
          transactionUnsigned.inputs.length === 0 &&
          ((transactionUnsigned as any).claims == null ||
            /* istanbul ignore next */
            !Array.isArray((transactionUnsigned as any).claims) ||
            /* istanbul ignore next */
            (transactionUnsigned as any).claims.length === 0)
        ) {
          transactionUnsigned = transactionUnsigned.clone({
            attributes: transactionUnsigned.attributes.concat(
              this.convertAttributes([
                {
                  usage: 'Script',
                  data: scriptHash,
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
            scriptHash,
            witness: this.convertWitness(witness),
          })
            .serializeWire()
            .toString('hex'),
          span,
        );

        return {
          transaction,
          confirmed: async (optionsIn: GetOptions = {}): Promise<T> => {
            const options = { ...optionsIn };
            if (options.timeoutMS == null) {
              options.timeoutMS = 120000;
            }
            const receipt = await this.provider.getTransactionReceipt(
              from.network,
              transaction.txid,
              options,
            );

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
    scriptHash,
    witness,
  }: {
    transaction: TransactionModel;
    scriptHash: Hash160String;
    witness: WitnessModel;
  }): TransactionModel {
    const scriptAttributes = transaction.attributes.filter(
      (attribute): attribute is UInt160Attribute =>
        attribute.usage === AttributeUsage.Script,
    );
    const scriptHashes = scriptAttributes.map((attribute) =>
      common.uInt160ToString(attribute.value),
    );

    if (
      scriptHashes.length === 2 ||
      (scriptHashes.length === 1 && scriptHashes[0] !== scriptHash)
    ) {
      let otherHash = scriptHashes[0];
      if (scriptHashes.length === 2) {
        const [first, second] = scriptHashes;
        if (!(first === scriptHash || second === scriptHash)) {
          throw new InvalidTransactionError('Something went wrong!');
        }

        otherHash = first === scriptHash ? second : first;
      }

      const otherScript = transaction.scripts[0];
      if (otherScript == null || transaction.scripts.length !== 1) {
        throw new InvalidTransactionError('Something went wrong!');
      }

      return transaction.clone({
        scripts: _.sortBy(
          [[scriptHash, witness], [otherHash, otherScript]] as Array<
            [string, WitnessModel]
          >,
          (value) => value[0],
        ).map((value: [string, WitnessModel]) => value[1]),
      });
    } else if (
      scriptHashes.length === 0 ||
      (scriptHashes.length === 1 && scriptHashes[0] === scriptHash)
    ) {
      if (transaction.scripts.length !== 0) {
        throw new InvalidTransactionError('Something went wrong!');
      }

      return transaction.clone({ scripts: [witness] });
    }

    throw new InvalidTransactionError('Something went wrong!');
  }

  private async getTransfersInputOutputs({
    from,
    transfers: transfersIn,
    gas,
    monitor,
  }: {
    from: UserAccountID;
    transfers: Transfer[];
    gas: BigNumber;
    monitor?: Monitor;
  }): Promise<{ outputs: Output[]; inputs: Input[] }> {
    const transfers = transfersIn.map((transfer) => ({
      to: transfer.to,
      asset: transfer.asset,
      amount: transfer.amount,
    })) as Array<{
      to?: AddressString;
      asset: Hash256String;
      amount: BigNumber;
    }>;

    if (transfers.length === 0 && gas.lte(utils.ZERO_BIG_NUMBER)) {
      return { inputs: [], outputs: [] };
    }

    const allOutputs = await this.provider.getUnspentOutputs(
      from.network,
      from.address,
      monitor,
    );

    return Object.values(
      _.groupBy(
        gas.isEqualTo(utils.ZERO_BIG_NUMBER)
          ? transfers
          : transfers.concat({
              amount: gas,
              asset: common.GAS_ASSET_HASH,
            }),
        ({ asset }) => asset,
      ),
    ).reduce(
      (acc, toByAsset) => {
        const { asset } = toByAsset[0];
        const assetResults = toByAsset.reduce(
          (
            { remaining, remainingOutputs, inputs, outputs: innerOutputs },
            { amount, to },
          ) => {
            const result = this.getTransferInputOutputs({
              from: from.address,
              to,
              asset,
              amount,
              remainingOutputs,
              remaining,
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
            remainingOutputs: allOutputs.filter(
              (output) => output.asset === asset,
            ),
            inputs: [] as Input[],
            outputs: [] as Output[],
          },
        );

        const outputs = acc.outputs.concat(assetResults.outputs);
        if (assetResults.remaining.gt(utils.ZERO_BIG_NUMBER)) {
          outputs.push({
            address: from.address,
            asset,
            value: assetResults.remaining,
          } as Output);
        }

        return {
          inputs: acc.inputs.concat(assetResults.inputs),
          outputs,
        };
      },
      { inputs: [] as Input[], outputs: [] as Output[] },
    );
  }

  private getTransferInputOutputs({
    to,
    amount: originalAmount,
    asset,
    remainingOutputs,
    remaining,
  }: {
    from: AddressString;
    to?: AddressString;
    amount: BigNumber;
    asset: Hash256String;
    remainingOutputs: UnspentOutput[];
    remaining: BigNumber;
  }): {
    inputs: Input[];
    outputs: Output[];
    remainingOutputs: UnspentOutput[];
    remaining: BigNumber;
  } {
    const amount = originalAmount.minus(remaining);

    const outputs =
      to == null
        ? ([] as Output[])
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

    const outputsOrdered = remainingOutputs
      .sort((coinA, coinB) => coinA.value.comparedTo(coinB.value))
      .reverse();

    const sum = outputsOrdered.reduce(
      (acc: BigNumber, coin) => acc.plus(coin.value),
      utils.ZERO_BIG_NUMBER,
    );

    if (sum.lt(amount)) {
      throw new InsufficientFundsError(sum, amount);
    }

    // find input coins
    let k = 0;
    let amountRemaining = amount.plus(utils.ZERO_BIG_NUMBER);
    while (outputsOrdered[k].value.lte(amountRemaining)) {
      amountRemaining = amountRemaining.minus(outputsOrdered[k].value);
      if (amountRemaining.isEqualTo(utils.ZERO_BIG_NUMBER)) {
        break;
      }
      k += 1;
    }

    let coinAmount = utils.ZERO_BIG_NUMBER;
    const inputs = [] as Input[];
    for (let i = 0; i < k + 1; i += 1) {
      coinAmount = coinAmount.plus(outputsOrdered[i].value);
      inputs.push({
        txid: outputsOrdered[i].txid,
        vout: outputsOrdered[i].vout,
      });
    }

    return {
      inputs,
      outputs,
      remainingOutputs: outputsOrdered.slice(k + 1),
      remaining: coinAmount.minus(amount),
    };
  }

  private getInvokeAttributeTag(
    contract: Hash160String,
    method: string,
    paramsZipped: Array<[string, Param | null]>,
  ): string {
    return JSON.stringify({
      contract,
      method,
      params: paramsZipped.map(([name, param]) => [
        name,
        this.paramToJSON(param),
      ]),
    });
  }

  private paramToJSON(param: Param | null): ParamJSON | null {
    if (param == null) {
      return param;
    }

    if (Array.isArray(param)) {
      return param.map((value) => this.paramToJSON(value));
    }

    if (BigNumber.isBigNumber(param)) {
      return param.toString();
    }

    return param as any;
  }

  private convertAttributes(attributes: Attribute[]): AttributeModel[] {
    return attributes.map((attribute) => converters.attribute(attribute));
  }

  private convertInputs(inputs: Input[]): InputModel[] {
    return inputs.map((input) => converters.input(input));
  }

  private convertOutputs(outputs: Output[]): OutputModel[] {
    return outputs.map((output) => converters.output(output));
  }

  private convertWitness(script: Witness): WitnessModel {
    return converters.witness(script);
  }

  private capture<T>(
    func: (monitor?: Monitor) => Promise<T>,
    {
      name,
      labels: labelsIn,
      metric,
    }: {
      name: string;
      labels?: Labels;
      metric?: {
        total: Histogram;
        error: Counter;
      };
    },
    monitor?: Monitor,
  ): Promise<T> {
    if (monitor == null) {
      return func();
    }

    const labels = labelsIn || {};
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
