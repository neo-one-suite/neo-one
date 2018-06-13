import BN from 'bn.js';
import {
  VMState,
  AccountJSON,
  ActionJSON,
  AssetJSON,
  AttributeJSON,
  BlockJSON,
  ContractJSON,
  ContractParameterJSON,
  InvocationDataJSON,
  InvocationResultJSON,
  InvocationTransactionJSON,
  OutputJSON,
  NetworkSettingsJSON,
  Param as ScriptBuilderParam,
  TransactionJSON,
  ValidatorJSON,
  InvocationTransaction as CoreInvocationTransaction,
  JSONHelper,
  common,
  utils,
} from '@neo-one/client-core';
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import BigNumber from 'bignumber.js';
import { Monitor } from '@neo-one/monitor';
import { utils as commonUtils } from '@neo-one/utils';
import _ from 'lodash';
import { flatten, flatMap } from 'ix/asynciterable/pipe/index';
import {
  Account,
  ActionRaw,
  AddressString,
  Asset,
  Attribute,
  Block,
  BlockFilter,
  BufferString,
  ConfirmedTransaction,
  Contract,
  ContractParameter,
  DataProvider,
  DeveloperProvider,
  GetOptions,
  Hash160String,
  Hash256String,
  Input,
  IssueTransaction,
  RawInvocationData,
  RawInvocationResult,
  NetworkSettings,
  NetworkType,
  Output,
  Peer,
  StorageItem,
  Transaction,
  TransactionBase,
  TransactionReceipt,
  UnspentOutput,
  Validator,
  Options,
} from '../../types';
import { AsyncBlockIterator } from '../../AsyncBlockIterator';
import { JSONRPCClient } from './JSONRPCClient';
import { JSONRPCHTTPProvider } from './JSONRPCHTTPProvider';
import { MissingTransactionDataError } from './errors';
import * as clientUtils from '../../utils';

export interface NEOONEDataProviderOptions {
  network: NetworkType;
  rpcURL: string;
  iterBlocksFetchTimeoutMS?: number;
  iterBlocksBatchSize?: number;
}

export class NEOONEDataProvider implements DataProvider, DeveloperProvider {
  public readonly network: NetworkType;
  private client: JSONRPCClient;
  private readonly iterBlocksFetchTimeoutMS: number | undefined;
  private readonly iterBlocksBatchSize: number | undefined;

  constructor({
    network,
    rpcURL,
    iterBlocksFetchTimeoutMS,
    iterBlocksBatchSize,
  }: NEOONEDataProviderOptions) {
    this.network = network;
    this.client = new JSONRPCClient(new JSONRPCHTTPProvider(rpcURL));
    this.iterBlocksFetchTimeoutMS = iterBlocksFetchTimeoutMS;
    this.iterBlocksBatchSize = iterBlocksBatchSize;
  }

  public setRPCURL(rpcURL: string): void {
    this.client = new JSONRPCClient(new JSONRPCHTTPProvider(rpcURL));
  }

  public getUnclaimed(
    address: AddressString,
    monitor?: Monitor,
  ): Promise<{ unclaimed: Input[]; amount: BigNumber }> {
    return this.capture(
      async (span) => {
        const account = await this.getAccountInternal(address, span);
        const amounts = await Promise.all(
          account.unclaimed.map((input) =>
            this.client.getClaimAmount(input, span),
          ),
        );

        return {
          unclaimed: account.unclaimed,
          amount: amounts.reduce(
            (acc, amount) => acc.plus(amount),
            utils.ZERO_BIG_NUMBER,
          ),
        };
      },
      'neo_get_unclaimed',
      monitor,
    );
  }

  public async getUnspentOutputs(
    address: AddressString,
    monitor?: Monitor,
  ): Promise<UnspentOutput[]> {
    return this.capture(
      async (span) => {
        const account = await this.getAccountInternal(address, span);
        const outputs = await Promise.all(
          account.unspent.map(
            async (input): Promise<UnspentOutput | null> => {
              const outputJSON = await this.client.getUnspentOutput(
                input,
                span,
              );

              if (outputJSON == null) {
                return null;
              }

              const output = this.convertOutput(outputJSON);

              return {
                asset: output.asset,
                value: output.value,
                address: output.address,
                txid: input.txid,
                vout: input.vout,
              };
            },
          ),
        );

        return outputs.filter(commonUtils.notNull);
      },
      'neo_get_unspent',
      monitor,
    );
  }

  public async relayTransaction(
    transaction: string,
    monitor?: Monitor,
  ): Promise<Transaction> {
    const result = await this.client.relayTransaction(transaction, monitor);
    return this.convertTransaction(result);
  }

  public getTransactionReceipt(
    hash: Hash256String,
    options?: GetOptions,
  ): Promise<TransactionReceipt> {
    return this.client.getTransactionReceipt(hash, options);
  }

  public async getInvocationData(
    hash: Hash256String,
    monitor?: Monitor,
  ): Promise<RawInvocationData> {
    const [invocationData, transaction] = await Promise.all([
      this.client.getInvocationData(hash, monitor),
      this.client.getTransaction(hash, monitor),
    ]);

    if (transaction.data == null) {
      throw new MissingTransactionDataError(hash);
    }

    return this.convertInvocationData(
      invocationData,
      transaction.data.blockHash,
      transaction.data.blockIndex,
      hash,
      transaction.data.index,
    );
  }

  public async testInvoke(
    transaction: string,
    monitor?: Monitor,
  ): Promise<RawInvocationResult> {
    const result = await this.client.testInvocation(transaction, monitor);
    return this.convertInvocationResult(result);
  }

  public async getAccount(
    address: AddressString,
    monitor?: Monitor,
  ): Promise<Account> {
    const account = await this.getAccountInternal(address, monitor);
    return {
      address,
      frozen: account.frozen,
      votes: account.votes,
      balances: account.balances.reduce(
        (acc: Account['balances'], { asset, value }) => {
          acc[asset] = new BigNumber(value);
          return acc;
        },
        {},
      ),
    };
  }

  public async getAsset(
    hash: Hash256String,
    monitor?: Monitor,
  ): Promise<Asset> {
    const asset = await this.client.getAsset(hash, monitor);
    return this.convertAsset(asset);
  }

  public async getBlock(
    hashOrIndex: Hash256String | number,
    options?: GetOptions,
  ): Promise<Block> {
    const block = await this.client.getBlock(hashOrIndex, options);
    return this.convertBlock(block);
  }

  public iterBlocks(filter: BlockFilter = {}): AsyncIterable<Block> {
    return AsyncIterableX.from(
      new AsyncBlockIterator({
        client: this,
        filter,
        fetchTimeoutMS: this.iterBlocksFetchTimeoutMS,
        batchSize: this.iterBlocksBatchSize,
      }),
    );
  }

  public getBestBlockHash(monitor?: Monitor): Promise<Hash256String> {
    return this.client.getBestBlockHash(monitor);
  }

  public getBlockCount(monitor?: Monitor): Promise<number> {
    return this.client.getBlockCount(monitor);
  }

  public async getContract(
    hash: Hash160String,
    monitor?: Monitor,
  ): Promise<Contract> {
    const contract = await this.client.getContract(hash, monitor);
    return this.convertContract(contract);
  }

  public getMemPool(monitor?: Monitor): Promise<Hash256String[]> {
    return this.client.getMemPool(monitor);
  }

  public async getTransaction(
    hash: Hash256String,
    monitor?: Monitor,
  ): Promise<Transaction> {
    const transaction = await this.client.getTransaction(hash, monitor);
    return this.convertTransaction(transaction);
  }

  public getValidators(monitor?: Monitor): Promise<Validator[]> {
    return this.client
      .getValidators(monitor)
      .then((validators) =>
        validators.map((validator) => this.convertValidator(validator)),
      );
  }

  public getConnectedPeers(monitor?: Monitor): Promise<Peer[]> {
    return this.client.getConnectedPeers(monitor);
  }

  public async getNetworkSettings(monitor?: Monitor): Promise<NetworkSettings> {
    const settings = await this.client.getNetworkSettings(monitor);
    return this.convertNetworkSettings(settings);
  }

  public getStorage(
    hash: Hash160String,
    key: BufferString,
    monitor?: Monitor,
  ): Promise<StorageItem> {
    return this.client.getStorageItem(hash, key, monitor);
  }

  public iterStorage(
    hash: Hash160String,
    monitor?: Monitor,
  ): AsyncIterable<StorageItem> {
    return AsyncIterableX.from(
      this.client
        .getAllStorage(hash, monitor)
        .then((res) => AsyncIterableX.from(res)),
    ).pipe(flatten<StorageItem>() as any);
  }

  public iterActionsRaw(filterIn?: BlockFilter): AsyncIterable<ActionRaw> {
    const filter = filterIn || {};
    return AsyncIterableX.from(
      this.iterBlocks({
        indexStart: filter.indexStart,
        indexStop: filter.indexStop,
        monitor: filter.monitor,
      }),
    ).pipe(
      flatMap(async (block) => {
        const actions = _.flatten(
          block.transactions.map((transaction) => {
            if (transaction.type === 'InvocationTransaction') {
              return transaction.invocationData.actions;
            }

            return [];
          }),
        );

        return AsyncIterableX.of(...actions);
      }),
    );
  }

  public call(
    contract: Hash160String,
    method: string,
    params: Array<ScriptBuilderParam | null>,
    monitor?: Monitor,
  ): Promise<RawInvocationResult> {
    const testTransaction = new CoreInvocationTransaction({
      version: 1,
      gas: common.TEN_THOUSAND_FIXED8,
      script: clientUtils.getInvokeMethodScript({
        hash: contract,
        method,
        params,
      }),
    });

    return this.testInvoke(
      testTransaction.serializeWire().toString('hex'),
      monitor,
    );
  }

  public runConsensusNow(monitor?: Monitor): Promise<void> {
    return this.client.runConsensusNow(monitor);
  }

  public updateSettings(options: Options, monitor?: Monitor): Promise<void> {
    return this.client.updateSettings(options, monitor);
  }

  public fastForwardOffset(seconds: number, monitor?: Monitor): Promise<void> {
    return this.client.fastForwardOffset(seconds, monitor);
  }

  public fastForwardToTime(seconds: number, monitor?: Monitor): Promise<void> {
    return this.client.fastForwardToTime(seconds, monitor);
  }

  public reset(monitor?: Monitor): Promise<void> {
    return this.client.reset(monitor);
  }

  private convertBlock(block: BlockJSON): Block {
    return {
      version: block.version,
      hash: block.hash,
      previousBlockHash: block.previousblockhash,
      merkleRoot: block.merkleroot,
      time: block.time,
      index: block.index,
      nonce: block.nonce,
      nextConsensus: block.nextconsensus,
      script: block.script,
      size: block.size,
      transactions: block.tx.map((transaction) =>
        this.convertConfirmedTransaction(transaction),
      ),
    };
  }

  private convertTransaction(transaction: TransactionJSON): Transaction {
    return this.convertTransactionBase(
      transaction,
      (invocation, transactionBase) => ({
        ...transactionBase,
        type: 'InvocationTransaction',
        script: invocation.script,
        gas: new BigNumber(invocation.gas),
      }),

      (converted) => converted,
    );
  }

  private convertConfirmedTransaction(
    transaction: TransactionJSON,
  ): ConfirmedTransaction {
    if (transaction.data == null) {
      throw new Error('Unexpected null data');
    }
    const data = {
      blockHash: transaction.data.blockHash,
      blockIndex: transaction.data.blockIndex,
      index: transaction.data.index,
      globalIndex: JSONHelper.readUInt64(transaction.data.globalIndex),
    };

    return this.convertTransactionBase(
      transaction,
      (invocation, transactionBase) => {
        if (invocation.invocationData == null || transaction.data == null) {
          throw new Error('Unexpected null data');
        }

        const invocationData = this.convertInvocationData(
          invocation.invocationData,
          transaction.data.blockHash,
          transaction.data.blockIndex,
          transaction.txid,
          transaction.data.index,
        );

        return {
          ...transactionBase,
          type: 'InvocationTransaction',
          script: invocation.script,
          gas: new BigNumber(invocation.gas),
          data,
          invocationData,
        };
      },
      (converted) => ({ ...converted, data } as ConfirmedTransaction),
    );
  }

  private convertTransactionBase<
    Result extends Transaction | ConfirmedTransaction
  >(
    transaction: TransactionJSON,
    convertInvocation: (
      invocation: InvocationTransactionJSON,
      transactionBase: TransactionBase,
    ) => Result,
    convertTransaction: (transaction: Transaction) => Result,
  ): Result {
    const transactionBase = {
      txid: transaction.txid,
      size: transaction.size,
      version: transaction.version,
      attributes: this.convertAttributes(transaction.attributes),
      vin: transaction.vin,
      vout: this.convertOutputs(transaction.vout),
      scripts: transaction.scripts,
      systemFee: new BigNumber(transaction.sys_fee),
      networkFee: new BigNumber(transaction.net_fee),
    };

    let converted: Transaction;
    switch (transaction.type) {
      case 'ClaimTransaction':
        converted = {
          ...transactionBase,
          type: 'ClaimTransaction',
          claims: transaction.claims,
        };
        break;
      case 'ContractTransaction':
        converted = {
          ...transactionBase,
          type: 'ContractTransaction',
        };
        break;
      case 'EnrollmentTransaction':
        converted = {
          ...transactionBase,
          type: 'EnrollmentTransaction',
          publicKey: transaction.pubkey,
        };
        break;
      case 'InvocationTransaction':
        return convertInvocation(transaction, transactionBase);
      case 'IssueTransaction':
        converted = {
          ...transactionBase,
          type: 'IssueTransaction',
        } as IssueTransaction;
        break;
      case 'MinerTransaction':
        converted = {
          ...transactionBase,
          type: 'MinerTransaction',
          nonce: transaction.nonce,
        };
        break;
      case 'PublishTransaction':
        converted = {
          ...transactionBase,
          type: 'PublishTransaction',
          contract: this.convertContract(transaction.contract),
        };
        break;
      case 'RegisterTransaction':
        converted = {
          ...transactionBase,
          type: 'RegisterTransaction',
          asset: {
            type: transaction.asset.type,
            name: Array.isArray(transaction.asset.name)
              ? transaction.asset.name[0].name
              : transaction.asset.name,
            amount: new BigNumber(transaction.asset.amount),
            precision: transaction.asset.precision,
            owner: transaction.asset.owner,
            admin: transaction.asset.admin,
          },
        };
        break;
      case 'StateTransaction':
        converted = {
          ...transactionBase,
          type: 'StateTransaction',
          descriptors: transaction.descriptors,
        };
        break;
      default:
        commonUtils.assertNever(transaction);
        throw new Error('For TS');
    }

    return convertTransaction(converted);
  }

  private convertAttributes(attributes: AttributeJSON[]): Attribute[] {
    return attributes.map((attribute) => ({
      usage: attribute.usage as any,
      data: attribute.data,
    }));
  }

  private convertOutputs(outputs: OutputJSON[]): Output[] {
    return outputs.map((output) => this.convertOutput(output));
  }

  private convertOutput(output: OutputJSON): Output {
    return {
      asset: output.asset,
      address: output.address,
      value: new BigNumber(output.value),
    };
  }

  private convertContract(contract: ContractJSON): Contract {
    return {
      version: contract.version,
      hash: contract.hash,
      script: contract.script,
      parameters: contract.parameters,
      returnType: contract.returntype,
      name: contract.name,
      codeVersion: contract.code_version,
      author: contract.author,
      email: contract.email,
      description: contract.description,
      properties: {
        storage: contract.properties.storage,
        dynamicInvoke: contract.properties.dynamic_invoke,
        payable: contract.properties.payable,
      },
    };
  }

  private convertInvocationData(
    data: InvocationDataJSON,
    blockHash: string,
    blockIndex: number,
    transactionHash: string,
    transactionIndex: number,
  ): RawInvocationData {
    return {
      result: this.convertInvocationResult(data.result),
      asset: data.asset == null ? data.asset : this.convertAsset(data.asset),
      contracts: data.contracts.map((contract) =>
        this.convertContract(contract),
      ),

      deletedContractHashes: data.deletedContractHashes,
      migratedContractHashes: data.migratedContractHashes,
      voteUpdates: data.voteUpdates,
      actions: data.actions.map((action, idx) =>
        this.convertAction(
          blockHash,
          blockIndex,
          transactionHash,
          transactionIndex,
          idx,
          action,
        ),
      ),
    };
  }

  private convertInvocationResult(
    result: InvocationResultJSON,
  ): RawInvocationResult {
    if (result.state === VMState.Fault) {
      return {
        state: 'FAULT',
        gasConsumed: new BigNumber(result.gas_consumed),
        gasCost: new BigNumber(result.gas_cost),
        stack: this.convertContractParameters(result.stack),
        message: result.message,
      };
    }

    return {
      state: 'HALT',
      gasConsumed: new BigNumber(result.gas_consumed),
      gasCost: new BigNumber(result.gas_cost),
      stack: this.convertContractParameters(result.stack),
    };
  }

  private convertContractParameters(
    parameters: ContractParameterJSON[],
  ): ContractParameter[] {
    return parameters.map((parameter) =>
      this.convertContractParameter(parameter),
    );
  }

  private convertContractParameter(
    parameter: ContractParameterJSON,
  ): ContractParameter {
    if (parameter.type === 'Integer') {
      return {
        type: 'Integer',
        value: new BN(parameter.value, 10),
      };
    }
    if (parameter.type === 'Array') {
      return {
        type: 'Array',
        value: this.convertContractParameters(parameter.value),
      };
    }

    return parameter;
  }

  private convertValidator(validator: ValidatorJSON): Validator {
    return {
      version: validator.version,
      publicKey: validator.publicKey,
      registered: validator.registered,
      votes: new BigNumber(validator.votes),
    };
  }

  private convertAction(
    blockHash: string,
    blockIndex: number,
    transactionHash: string,
    transactionIndex: number,
    index: number,
    action: ActionJSON,
  ): ActionRaw {
    if (action.type === 'Log') {
      return {
        type: 'Log',
        version: action.version,
        blockIndex,
        blockHash,
        transactionIndex,
        transactionHash,
        index,
        globalIndex: JSONHelper.readUInt64(action.index),
        scriptHash: action.scriptHash,
        message: action.message,
      };
    }

    return {
      type: 'Notification',
      version: action.version,
      blockIndex,
      blockHash,
      transactionIndex,
      transactionHash,
      index,
      globalIndex: JSONHelper.readUInt64(action.index),
      scriptHash: action.scriptHash,
      args: this.convertContractParameters(action.args),
    };
  }

  private convertAsset(asset: AssetJSON): Asset {
    const assetName = asset.name;
    let name;
    if (Array.isArray(assetName)) {
      const enName = assetName.find(({ lang }) => lang === 'en');
      if (enName == null) {
        // eslint-disable-next-line
        name = assetName[0].name;
      } else {
        // eslint-disable-next-line
        name = enName.name;
      }
    } else {
      name = assetName;
    }
    return {
      hash: asset.id,
      type: asset.type,
      name,
      amount: new BigNumber(asset.amount),
      available: new BigNumber(asset.available),
      precision: asset.precision,
      owner: asset.owner,
      admin: asset.admin,
      issuer: asset.issuer,
      expiration: asset.expiration,
      frozen: asset.frozen,
    };
  }

  private getAccountInternal(
    address: AddressString,
    monitor?: Monitor,
  ): Promise<AccountJSON> {
    return this.client.getAccount(address, monitor);
  }

  private convertNetworkSettings(
    settings: NetworkSettingsJSON,
  ): NetworkSettings {
    return {
      issueGASFee: new BigNumber(settings.issueGASFee),
    };
  }

  private capture<T>(
    func: (monitor?: Monitor) => Promise<T>,
    name: string,
    monitor?: Monitor,
  ): Promise<T> {
    if (monitor == null) {
      return func();
    }

    return monitor.at('neo_one_data_provider').captureSpanLog(func, {
      name,
      level: { log: 'verbose', span: 'info' },
      trace: true,
    });
  }
}
