/* @flow */
import BigNumber from 'bignumber.js';
import {
  ATTRIBUTE_USAGE,
  CONTRACT_PROPERTY_STATE,
  type Attribute as AttributeModel,
  type Input as InputModel,
  type Output as OutputModel,
  type Param as ScriptBuilderParam,
  type Transaction as TransactionModel,
  type UInt160Attribute,
  Contract as ContractModel,
  ClaimTransaction,
  ContractTransaction,
  InvocationTransaction,
  IssueTransaction,
  ScriptBuilder,
  Witness as WitnessModel,
  assertAssetTypeJSON,
  assertContractParameterTypeJSON,
  toAssetType,
  toContractParameterType,
  common,
  utils,
} from '@neo-one/client-core';
import {
  type Counter,
  type Histogram,
  type Labels,
  type Monitor,
  metrics,
} from '@neo-one/monitor';
import type { Observable } from 'rxjs/Observable';

import _ from 'lodash';
import { labels as labelNames, utils as commonUtils } from '@neo-one/utils';

import type {
  AddressString,
  AssetRegister,
  Attribute,
  ContractRegister,
  DataProvider,
  GetOptions,
  Hash160String,
  Hash256String,
  Transfer,
  TransactionOptions,
  PublishReceipt,
  RegisterAssetReceipt,
  TransactionReceipt,
  TransactionResult,
  Input,
  InvokeReceiptInternal,
  RawInvocationData,
  InvocationResultError,
  InvocationResultSuccess,
  RawInvocationResult,
  RawInvocationResultError,
  RawInvocationResultSuccess,
  InvokeTransactionOptions,
  NetworkSettings,
  NetworkType,
  Output,
  Param,
  ParamJSON,
  Transaction,
  UnspentOutput,
  UpdateAccountNameOptions,
  UserAccount,
  UserAccountID,
  UserAccountProvider,
  Witness,
} from '../types';
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
import * as clientUtils from '../utils';
import converters from './converters';

export type KeyStore = {
  +type: string,
  +currentAccount$: Observable<?UserAccount>,
  +getCurrentAccount: () => ?UserAccount,
  +accounts$: Observable<Array<UserAccount>>,
  +getAccounts: () => Array<UserAccount>,
  +selectAccount: (id?: UserAccountID, monitor?: Monitor) => Promise<void>,
  +deleteAccount: (id: UserAccountID, monitor?: Monitor) => Promise<void>,
  +updateAccountName: (options: UpdateAccountNameOptions) => Promise<void>,
  +sign: (options: {|
    account: UserAccountID,
    message: string,
    monitor?: Monitor,
  |}) => Promise<Witness>,
};

export type Provider = {
  +networks$: Observable<Array<NetworkType>>,
  +getNetworks: () => Array<NetworkType>,
  +getUnclaimed: (
    network: NetworkType,
    address: AddressString,
    monitor?: Monitor,
  ) => Promise<{| unclaimed: Array<Input>, amount: BigNumber |}>,
  +getUnspentOutputs: (
    network: NetworkType,
    address: AddressString,
    monitor?: Monitor,
  ) => Promise<Array<UnspentOutput>>,
  +relayTransaction: (
    network: NetworkType,
    transaction: string,
    monitor?: Monitor,
  ) => Promise<Transaction>,
  +getTransactionReceipt: (
    network: NetworkType,
    hash: Hash256String,
    options?: GetOptions,
  ) => Promise<TransactionReceipt>,
  +getInvocationData: (
    network: NetworkType,
    hash: Hash256String,
    monitor?: Monitor,
  ) => Promise<RawInvocationData>,
  +testInvoke: (
    network: NetworkType,
    transaction: string,
    monitor?: Monitor,
  ) => Promise<RawInvocationResult>,
  +getNetworkSettings: (
    network: NetworkType,
    monitor?: Monitor,
  ) => Promise<NetworkSettings>,
  +read: (network: NetworkType) => DataProvider,
};

type TransactionOptionsFull = {|
  from: UserAccountID,
  attributes: Array<Attribute>,
  networkFee: BigNumber,
  monitor?: Monitor,
|};

const NEO_ONE_ATTRIBUTE = {
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

export default class LocalUserAccountProvider<
  TKeyStore: KeyStore,
  TProvider: Provider,
> implements UserAccountProvider {
  +type: string;
  +currentAccount$: Observable<?UserAccount>;
  +accounts$: Observable<Array<UserAccount>>;
  +networks$: Observable<Array<NetworkType>>;

  +keystore: TKeyStore;
  +provider: TProvider;

  constructor({
    keystore,
    provider,
  }: {|
    keystore: TKeyStore,
    provider: TProvider,
  |}) {
    this.type = keystore.type;
    this.keystore = keystore;
    this.provider = provider;

    this.currentAccount$ = keystore.currentAccount$;
    this.accounts$ = keystore.accounts$;
    this.networks$ = provider.networks$;
  }

  getCurrentAccount(): ?UserAccount {
    return this.keystore.getCurrentAccount();
  }

  getAccounts(): Array<UserAccount> {
    return this.keystore.getAccounts();
  }

  getNetworks(): Array<NetworkType> {
    return this.provider.getNetworks();
  }

  async transfer(
    transfers: Array<Transfer>,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>> {
    const {
      from,
      attributes,
      networkFee,
      monitor,
    } = this._getTransactionOptions(options);

    return this._capture(
      async span => {
        const { inputs, outputs } = await this._getTransfersInputOutputs({
          transfers,
          from,
          gas: networkFee,
          monitor: span,
        });

        if (inputs.length === 0) {
          throw new NothingToTransferError();
        }

        const transaction = new ContractTransaction({
          inputs: this._convertInputs(inputs),
          outputs: this._convertOutputs(outputs),
          attributes: this._convertAttributes(attributes),
        });
        return this._sendTransaction({
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

  async claim(
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>> {
    const {
      from,
      attributes,
      networkFee,
      monitor,
    } = this._getTransactionOptions(options);

    return this._capture(
      async span => {
        const [{ unclaimed, amount }, { inputs, outputs }] = await Promise.all([
          this.provider.getUnclaimed(from.network, from.address, span),
          this._getTransfersInputOutputs({
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
          inputs: this._convertInputs(inputs),
          claims: this._convertInputs(unclaimed),
          outputs: this._convertOutputs(
            outputs.concat([
              {
                address: from.address,
                asset: common.GAS_ASSET_HASH,
                value: amount,
              },
            ]),
          ),
          attributes: this._convertAttributes(attributes),
        });
        return this._sendTransaction({
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

  publish(
    contractIn: ContractRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt>> {
    let contractProperties = CONTRACT_PROPERTY_STATE.NO_PROPERTY;
    if (contractIn.properties.storage && contractIn.properties.dynamicInvoke) {
      contractProperties = CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE;
    } else if (contractIn.properties.storage) {
      contractProperties = CONTRACT_PROPERTY_STATE.HAS_STORAGE;
    } else if (contractIn.properties.dynamicInvoke) {
      contractProperties = CONTRACT_PROPERTY_STATE.HAS_DYNAMIC_INVOKE;
    }
    const contract = new ContractModel({
      script: Buffer.from(contractIn.script, 'hex'),
      parameterList: contractIn.parameters.map(parameter =>
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
      contractProperties,
    });

    const sb = new ScriptBuilder();
    sb.emitSysCall(
      'Neo.Contract.Create',
      contract.script,
      Buffer.from(contract.parameterList),
      contract.returnType,
      contract.hasStorage,
      contract.name,
      contract.codeVersion,
      contract.author,
      contract.email,
      contract.description,
    );

    return this._invokeRaw({
      script: sb.build(),
      options,
      onConfirm: ({ receipt, data }): PublishReceipt => {
        let result;
        if (data.result.state === 'FAULT') {
          result = this._getInvocationResultError(data.result);
        } else {
          const [createdContract] = data.contracts;
          if (createdContract == null) {
            throw new InvalidTransactionError(
              'Something went wrong! Expected a contract to have been created, ' +
                'but none was found',
            );
          }

          result = this._getInvocationResultSuccess(
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

  registerAsset(
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

    return this._invokeRaw({
      script: sb.build(),
      options,
      onConfirm: ({ receipt, data }): RegisterAssetReceipt => {
        let result;
        if (data.result.state === 'FAULT') {
          result = this._getInvocationResultError(data.result);
        } else {
          const createdAsset = data.asset;
          if (createdAsset == null) {
            throw new InvalidTransactionError(
              'Something went wrong! Expected a asset to have been created, ' +
                'but none was found',
            );
          }

          result = this._getInvocationResultSuccess(data.result, createdAsset);
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

  async issue(
    transfers: Array<Transfer>,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>> {
    const {
      from,
      attributes,
      networkFee,
      monitor,
    } = this._getTransactionOptions(options);

    return this._capture(
      async span => {
        const settings = await this.provider.getNetworkSettings(
          from.network,
          span,
        );
        const { inputs, outputs } = await this._getTransfersInputOutputs({
          transfers: [],
          from,
          gas: networkFee.plus(settings.issueGASFee),
          monitor: span,
        });

        if (inputs.length === 0) {
          throw new NothingToIssueError();
        }

        const issueOutputs = outputs.concat(
          transfers.map(transfer => ({
            address: transfer.to,
            asset: transfer.asset,
            value: transfer.amount,
          })),
        );

        const transaction = new IssueTransaction({
          inputs: this._convertInputs(inputs),
          outputs: this._convertOutputs(issueOutputs),
          attributes: this._convertAttributes(attributes),
        });
        return this._sendTransaction({
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

  invoke(
    contract: Hash160String,
    method: string,
    params: Array<?ScriptBuilderParam>,
    paramsZipped: Array<[string, ?Param]>,
    verify: boolean,
    optionsIn?: InvokeTransactionOptions,
  ): Promise<TransactionResult<InvokeReceiptInternal>> {
    const options = optionsIn || {};
    return this._invokeRaw({
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
                `neo-one-invoke:${this._getInvokeAttributeTag(
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
                }: $FlowFixMe)
              : null,
          ].filter(Boolean),
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
      ].filter(Boolean),
      method: 'invoke',
      labels: {
        [labelNames.INVOKE_METHOD]: method,
      },
    });
  }

  call(
    contract: Hash160String,
    method: string,
    params: Array<?ScriptBuilderParam>,
    options?: TransactionOptions,
  ): Promise<RawInvocationResult> {
    const {
      from,
      attributes,
      networkFee,
      monitor,
    } = this._getTransactionOptions(options);

    return this._capture(
      async span => {
        const transfers = (options || {}).transfers || [];
        const { inputs, outputs } = await this._getTransfersInputOutputs({
          transfers,
          from,
          gas: networkFee,
          monitor: span,
        });
        const testTransaction = new InvocationTransaction({
          version: 1,
          inputs: this._convertInputs(inputs),
          outputs: this._convertOutputs(outputs),
          attributes: this._convertAttributes(attributes),
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

  async selectAccount(id?: UserAccountID, monitor?: Monitor): Promise<void> {
    await this.keystore.selectAccount(id, monitor);
  }

  async deleteAccount(id: UserAccountID, monitor?: Monitor): Promise<void> {
    await this.keystore.deleteAccount(id, monitor);
  }

  async updateAccountName(options: UpdateAccountNameOptions): Promise<void> {
    await this.keystore.updateAccountName(options);
  }

  read(network: NetworkType): DataProvider {
    return this.provider.read(network);
  }

  _getTransactionOptions(
    optionsIn?: TransactionOptions | InvokeTransactionOptions,
  ): TransactionOptionsFull {
    const options = optionsIn || {};
    // $FlowFixMe
    const attributes = (options.attributes || []: Array<Attribute>);

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

  _getInvocationResultError(
    result: RawInvocationResultError,
  ): InvocationResultError {
    return {
      state: result.state,
      gasConsumed: result.gasConsumed,
      message: result.message,
    };
  }

  _getInvocationResultSuccess<T>(
    result: RawInvocationResultSuccess,
    value: T,
  ): InvocationResultSuccess<T> {
    return {
      state: result.state,
      gasConsumed: result.gasConsumed,
      value,
    };
  }

  async _invokeRaw<T>({
    script,
    options,
    onConfirm,
    method,
    scripts: scriptsIn,
    labels,
  }: {|
    script: Buffer,
    options?: TransactionOptions | InvokeTransactionOptions,
    onConfirm: (options: {|
      transaction: Transaction,
      data: RawInvocationData,
      receipt: TransactionReceipt,
    |}) => Promise<T> | T,
    method: string,
    scripts?: Array<WitnessModel>,
    labels?: Labels,
  |}): Promise<TransactionResult<T>> {
    const {
      from,
      attributes: attributesIn,
      networkFee,
      monitor,
    } = this._getTransactionOptions(options);

    return this._capture(
      async span => {
        const transfers = (options || {}).transfers || [];
        const {
          inputs: testInputs,
          outputs: testOutputs,
        } = await this._getTransfersInputOutputs({
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
          inputs: this._convertInputs(testInputs),
          outputs: this._convertOutputs(testOutputs),
          attributes: this._convertAttributes(attributes),
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
        const { inputs, outputs } = await this._getTransfersInputOutputs({
          transfers,
          from,
          gas: networkFee.plus(result.gasConsumed),
          monitor: span,
        });

        const invokeTransaction = new InvocationTransaction({
          version: 1,
          inputs: this._convertInputs(inputs),
          outputs: this._convertOutputs(outputs),
          attributes: this._convertAttributes(attributes),
          gas: clientUtils.bigNumberToBN(result.gasConsumed, 8),
          script,
          scripts,
        });

        return this._sendTransaction({
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

  _sendTransaction<T>({
    transaction: transactionUnsignedIn,
    from,
    onConfirm,
    monitor,
  }: {|
    transaction: TransactionModel,
    from: UserAccountID,
    onConfirm: (options: {|
      transaction: Transaction,
      receipt: TransactionReceipt,
    |}) => Promise<T>,
    monitor?: Monitor,
  |}): Promise<TransactionResult<T>> {
    return this._capture(
      async span => {
        let transactionUnsigned = transactionUnsignedIn;
        const scriptHash = addressToScriptHash(from.address);
        if (
          transactionUnsigned.inputs.length === 0 &&
          (transactionUnsigned.claims == null ||
            /* istanbul ignore next */
            !Array.isArray(transactionUnsigned.claims) ||
            /* istanbul ignore next */
            transactionUnsigned.claims.length === 0)
        ) {
          transactionUnsigned = transactionUnsigned.clone({
            attributes: transactionUnsigned.attributes.concat(
              this._convertAttributes([
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
          this._addWitness({
            transaction: transactionUnsigned,
            scriptHash,
            witness: this._convertWitness(witness),
          })
            .serializeWire()
            .toString('hex'),
          span,
        );

        return {
          transaction,
          confirmed: async (optionsIn?: GetOptions): Promise<T> => {
            const options = optionsIn || ({}: $FlowFixMe);
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
  _addWitness({
    transaction,
    scriptHash,
    witness,
  }: {|
    transaction: TransactionModel,
    scriptHash: Hash160String,
    witness: WitnessModel,
  |}): TransactionModel {
    // $FlowFixMe
    const scriptAttributes = (transaction.attributes.filter(
      attribute => attribute.usage === ATTRIBUTE_USAGE.SCRIPT,
    ): Array<UInt160Attribute>);
    const scriptHashes = scriptAttributes.map(attribute =>
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
          [[scriptHash, witness], [otherHash, otherScript]],
          value => value[0],
        ).map(value => value[1]),
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

  async _getTransfersInputOutputs({
    from,
    transfers: transfersIn,
    gas,
    monitor,
  }: {|
    from: UserAccountID,
    transfers: Array<Transfer>,
    gas: BigNumber,
    monitor?: Monitor,
  |}): Promise<{| outputs: Array<Output>, inputs: Array<Input> |}> {
    const transfers = (transfersIn.map(transfer => ({
      to: transfer.to,
      asset: transfer.asset,
      amount: transfer.amount,
    })): Array<{|
      to?: AddressString,
      asset: Hash256String,
      amount: BigNumber,
    |}>);

    if (transfers.length === 0 && gas.lte(utils.ZERO_BIG_NUMBER)) {
      return { inputs: [], outputs: [] };
    }

    const allOutputs = await this.provider.getUnspentOutputs(
      from.network,
      from.address,
      monitor,
    );
    return commonUtils
      .values(
        _.groupBy(
          gas.isEqualTo(utils.ZERO_BIG_NUMBER)
            ? transfers
            : transfers.concat({
                amount: gas,
                asset: common.GAS_ASSET_HASH,
              }),
          ({ asset }) => asset,
        ),
      )
      .reduce(
        (acc, toByAsset) => {
          const { asset } = toByAsset[0];
          const assetResults = toByAsset.reduce(
            (
              { remaining, remainingOutputs, inputs, outputs },
              { amount, to },
            ) => {
              const result = this._getTransferInputOutputs({
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
                outputs: outputs.concat(result.outputs),
              };
            },
            {
              remaining: utils.ZERO_BIG_NUMBER,
              remainingOutputs: allOutputs.filter(
                output => output.asset === asset,
              ),
              inputs: ([]: Array<Input>),
              outputs: ([]: Array<Output>),
            },
          );

          const outputs = acc.outputs.concat(assetResults.outputs);
          if (assetResults.remaining.gt(utils.ZERO_BIG_NUMBER)) {
            outputs.push(
              ({
                address: from.address,
                asset,
                value: assetResults.remaining,
              }: Output),
            );
          }

          return {
            inputs: acc.inputs.concat(assetResults.inputs),
            outputs,
          };
        },
        { inputs: ([]: Array<Input>), outputs: ([]: Array<Output>) },
      );
  }

  _getTransferInputOutputs({
    to,
    amount: originalAmount,
    asset,
    remainingOutputs,
    remaining,
  }: {|
    from: AddressString,
    to?: AddressString,
    amount: BigNumber,
    asset: Hash256String,
    remainingOutputs: Array<UnspentOutput>,
    remaining: BigNumber,
  |}): {|
    inputs: Array<Input>,
    outputs: Array<Output>,
    remainingOutputs: Array<UnspentOutput>,
    remaining: BigNumber,
  |} {
    const amount = originalAmount.minus(remaining);

    const outputs =
      to == null
        ? ([]: Array<Output>)
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
      (acc, coin) => acc.plus(coin.value),
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
    const inputs = ([]: Array<Input>);
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

  _getInvokeAttributeTag(
    contract: Hash160String,
    method: string,
    paramsZipped: Array<[string, ?Param]>,
  ): string {
    return JSON.stringify({
      contract,
      method,
      params: paramsZipped.map(([name, param]) => [
        name,
        this._paramToJSON(param),
      ]),
    });
  }

  _paramToJSON(param: ?Param): ?ParamJSON {
    if (param == null) {
      return param;
    }

    if (Array.isArray(param)) {
      return param.map(value => this._paramToJSON(value));
    }

    if (BigNumber.isBigNumber(param)) {
      return param.toString();
    }

    return (param: $FlowFixMe);
  }

  _convertAttributes(attributes: Array<Attribute>): Array<AttributeModel> {
    return attributes.map(attribute => converters.attribute(attribute));
  }

  _convertInputs(inputs: Array<Input>): Array<InputModel> {
    return inputs.map(input => converters.input(input));
  }

  _convertOutputs(outputs: Array<Output>): Array<OutputModel> {
    return outputs.map(output => converters.output(output));
  }

  _convertWitness(script: Witness): WitnessModel {
    return converters.witness(script);
  }

  _capture<T>(
    func: (monitor?: Monitor) => Promise<T>,
    {
      name,
      labels: labelsIn,
      metric,
    }: {|
      name: string,
      labels?: Labels,
      metric?: {|
        total: Histogram,
        error: Counter,
      |},
    |},
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
