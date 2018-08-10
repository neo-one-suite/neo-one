import {
  AccountJSON,
  AssetJSON,
  AttributeJSON,
  BlockJSON,
  common,
  ContractJSON,
  convertAction,
  convertCallReceipt,
  convertInvocationResult,
  InvocationDataJSON,
  InvocationTransaction as CoreInvocationTransaction,
  InvocationTransactionJSON,
  JSONHelper,
  NetworkSettingsJSON,
  OutputJSON,
  ScriptBuilderParam,
  TransactionJSON,
  utils,
  ValidatorJSON,
} from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import { utils as commonUtils } from '@neo-one/utils';
import { AsyncIterableX } from '@reactivex/ix-esnext-esm/asynciterable/asynciterablex';
import { flatMap } from '@reactivex/ix-esnext-esm/asynciterable/pipe/flatmap';
import { flatten } from '@reactivex/ix-esnext-esm/asynciterable/pipe/flatten';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { AsyncBlockIterator } from '../../AsyncBlockIterator';
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
  DataProvider,
  DeveloperProvider,
  GetOptions,
  Hash160String,
  Hash256String,
  Input,
  NetworkSettings,
  NetworkType,
  Options,
  Output,
  Peer,
  RawCallReceipt,
  RawInvocationData,
  StorageItem,
  Transaction,
  TransactionBase,
  TransactionReceipt,
  UnspentOutput,
  Validator,
} from '../../types';
import * as clientUtils from '../../utils';
import { MissingTransactionDataError } from './errors';
import { JSONRPCClient } from './JSONRPCClient';
import { JSONRPCHTTPProvider } from './JSONRPCHTTPProvider';

export interface NEOONEDataProviderOptions {
  readonly network: NetworkType;
  readonly rpcURL: string;
  readonly iterBlocksFetchTimeoutMS?: number;
  readonly iterBlocksBatchSize?: number;
}

export class NEOONEDataProvider implements DataProvider, DeveloperProvider {
  public readonly network: NetworkType;
  private mutableClient: JSONRPCClient;
  private readonly iterBlocksFetchTimeoutMS: number | undefined;
  private readonly iterBlocksBatchSize: number | undefined;

  public constructor({ network, rpcURL, iterBlocksFetchTimeoutMS, iterBlocksBatchSize }: NEOONEDataProviderOptions) {
    this.network = network;
    this.mutableClient = new JSONRPCClient(new JSONRPCHTTPProvider(rpcURL));
    this.iterBlocksFetchTimeoutMS = iterBlocksFetchTimeoutMS;
    this.iterBlocksBatchSize = iterBlocksBatchSize;
  }

  public setRPCURL(rpcURL: string): void {
    this.mutableClient = new JSONRPCClient(new JSONRPCHTTPProvider(rpcURL));
  }

  public async getUnclaimed(
    address: AddressString,
    monitor?: Monitor,
  ): Promise<{ readonly unclaimed: ReadonlyArray<Input>; readonly amount: BigNumber }> {
    return this.capture(
      async (span) => {
        const account = await this.getAccountInternal(address, span);
        const amounts = await Promise.all(
          account.unclaimed.map(async (input) => this.mutableClient.getClaimAmount(input, span)),
        );

        return {
          unclaimed: account.unclaimed,
          amount: amounts.reduce((acc, amount) => acc.plus(amount), utils.ZERO_BIG_NUMBER),
        };
      },
      'neo_get_unclaimed',
      monitor,
    );
  }

  public async getUnspentOutputs(address: AddressString, monitor?: Monitor): Promise<ReadonlyArray<UnspentOutput>> {
    return this.capture(
      async (span) => {
        const account = await this.getAccountInternal(address, span);
        const outputs = await Promise.all(
          account.unspent.map(
            async (input): Promise<UnspentOutput | undefined> => {
              const outputJSON = await this.mutableClient.getUnspentOutput(input, span);

              if (outputJSON === undefined) {
                return undefined;
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

  public async relayTransaction(transaction: string, monitor?: Monitor): Promise<Transaction> {
    const result = await this.mutableClient.relayTransaction(transaction, monitor);

    return this.convertTransaction(result);
  }

  public async getTransactionReceipt(hash: Hash256String, options?: GetOptions): Promise<TransactionReceipt> {
    return this.mutableClient.getTransactionReceipt(hash, options);
  }

  public async getInvocationData(hash: Hash256String, monitor?: Monitor): Promise<RawInvocationData> {
    const [invocationData, transaction] = await Promise.all([
      this.mutableClient.getInvocationData(hash, monitor),
      this.mutableClient.getTransaction(hash, monitor),
    ]);

    if (transaction.data === undefined) {
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

  public async testInvoke(transaction: string, monitor?: Monitor): Promise<RawCallReceipt> {
    const receipt = await this.mutableClient.testInvocation(transaction, monitor);

    return convertCallReceipt(receipt);
  }

  public async getAccount(address: AddressString, monitor?: Monitor): Promise<Account> {
    const account = await this.getAccountInternal(address, monitor);

    return {
      address,
      frozen: account.frozen,
      votes: account.votes,
      balances: account.balances.reduce<Account['balances']>(
        (acc, { asset, value }) => ({
          ...acc,
          [asset]: new BigNumber(value),
        }),
        {},
      ),
    };
  }

  public async getAsset(hash: Hash256String, monitor?: Monitor): Promise<Asset> {
    const asset = await this.mutableClient.getAsset(hash, monitor);

    return this.convertAsset(asset);
  }

  public async getBlock(hashOrIndex: Hash256String | number, options?: GetOptions): Promise<Block> {
    const block = await this.mutableClient.getBlock(hashOrIndex, options);

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

  public async getBestBlockHash(monitor?: Monitor): Promise<Hash256String> {
    return this.mutableClient.getBestBlockHash(monitor);
  }

  public async getBlockCount(monitor?: Monitor): Promise<number> {
    return this.mutableClient.getBlockCount(monitor);
  }

  public async getContract(hash: Hash160String, monitor?: Monitor): Promise<Contract> {
    const contract = await this.mutableClient.getContract(hash, monitor);

    return this.convertContract(contract);
  }

  public async getMemPool(monitor?: Monitor): Promise<ReadonlyArray<Hash256String>> {
    return this.mutableClient.getMemPool(monitor);
  }

  public async getTransaction(hash: Hash256String, monitor?: Monitor): Promise<Transaction> {
    const transaction = await this.mutableClient.getTransaction(hash, monitor);

    return this.convertTransaction(transaction);
  }

  public async getOutput(input: Input, monitor?: Monitor): Promise<Output> {
    const output = await this.mutableClient.getOutput(input, monitor);

    return this.convertOutput(output);
  }

  public async getValidators(monitor?: Monitor): Promise<ReadonlyArray<Validator>> {
    return this.mutableClient
      .getValidators(monitor)
      .then((validators) => validators.map((validator) => this.convertValidator(validator)));
  }

  public async getConnectedPeers(monitor?: Monitor): Promise<ReadonlyArray<Peer>> {
    return this.mutableClient.getConnectedPeers(monitor);
  }

  public async getNetworkSettings(monitor?: Monitor): Promise<NetworkSettings> {
    const settings = await this.mutableClient.getNetworkSettings(monitor);

    return this.convertNetworkSettings(settings);
  }

  public async getStorage(hash: Hash160String, key: BufferString, monitor?: Monitor): Promise<StorageItem> {
    return this.mutableClient.getStorageItem(hash, key, monitor);
  }

  public iterStorage(hash: Hash160String, monitor?: Monitor): AsyncIterable<StorageItem> {
    return AsyncIterableX.from(
      this.mutableClient.getAllStorage(hash, monitor).then((res) => AsyncIterableX.from(res)),
      // tslint:disable-next-line no-any
    ).pipe(flatten<StorageItem>() as any);
  }

  public iterActionsRaw(filter: BlockFilter = {}): AsyncIterable<ActionRaw> {
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
              return [...transaction.invocationData.actions];
            }

            return [];
          }),
        );

        return AsyncIterableX.of(...actions);
      }),
    );
  }

  public async call(
    contract: Hash160String,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ): Promise<RawCallReceipt> {
    const testTransaction = new CoreInvocationTransaction({
      version: 1,
      gas: common.TEN_THOUSAND_FIXED8,
      script: clientUtils.getInvokeMethodScript({
        hash: contract,
        method,
        params,
      }),
    });

    return this.testInvoke(testTransaction.serializeWire().toString('hex'), monitor);
  }

  public async runConsensusNow(monitor?: Monitor): Promise<void> {
    return this.mutableClient.runConsensusNow(monitor);
  }

  public async updateSettings(options: Options, monitor?: Monitor): Promise<void> {
    return this.mutableClient.updateSettings(options, monitor);
  }

  public async fastForwardOffset(seconds: number, monitor?: Monitor): Promise<void> {
    return this.mutableClient.fastForwardOffset(seconds, monitor);
  }

  public async fastForwardToTime(seconds: number, monitor?: Monitor): Promise<void> {
    return this.mutableClient.fastForwardToTime(seconds, monitor);
  }

  public async reset(monitor?: Monitor): Promise<void> {
    return this.mutableClient.reset(monitor);
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
      transactions: block.tx.map((transaction) => this.convertConfirmedTransaction(transaction)),
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

  private convertConfirmedTransaction(transaction: TransactionJSON): ConfirmedTransaction {
    if (transaction.data === undefined) {
      throw new Error('Unexpected undefined data');
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
        if (invocation.invocationData === undefined || transaction.data === undefined) {
          throw new Error('Unexpected undefined data');
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
      // tslint:disable-next-line no-any
      (converted) => ({ ...converted, data } as any),
    );
  }

  private convertTransactionBase<Result extends Transaction | ConfirmedTransaction>(
    transaction: TransactionJSON,
    convertInvocation: (invocation: InvocationTransactionJSON, transactionBase: TransactionBase) => Result,
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
        };
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
            name: Array.isArray(transaction.asset.name) ? transaction.asset.name[0].name : transaction.asset.name,
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

  private convertAttributes(attributes: ReadonlyArray<AttributeJSON>): ReadonlyArray<Attribute> {
    return attributes.map((attribute) => ({
      // tslint:disable-next-line no-any
      usage: attribute.usage as any,
      data: attribute.data,
    }));
  }

  private convertOutputs(outputs: ReadonlyArray<OutputJSON>): ReadonlyArray<Output> {
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
      result: convertInvocationResult(data.result),
      asset: data.asset === undefined ? data.asset : this.convertAsset(data.asset),
      contracts: data.contracts.map((contract) => this.convertContract(contract)),

      deletedContractHashes: data.deletedContractHashes,
      migratedContractHashes: data.migratedContractHashes,
      voteUpdates: data.voteUpdates,
      actions: data.actions.map((action, idx) =>
        convertAction(blockHash, blockIndex, transactionHash, transactionIndex, idx, action),
      ),
    };
  }

  private convertValidator(validator: ValidatorJSON): Validator {
    return {
      version: validator.version,
      publicKey: validator.publicKey,
      registered: validator.registered,
      votes: new BigNumber(validator.votes),
    };
  }

  private convertAsset(asset: AssetJSON): Asset {
    const assetName = asset.name;
    let name;
    if (Array.isArray(assetName)) {
      const enName = assetName.find(({ lang }) => lang === 'en');
      name = enName === undefined ? assetName[0].name : enName.name;
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

  private async getAccountInternal(address: AddressString, monitor?: Monitor): Promise<AccountJSON> {
    return this.mutableClient.getAccount(address, monitor);
  }

  private convertNetworkSettings(settings: NetworkSettingsJSON): NetworkSettings {
    return {
      issueGASFee: new BigNumber(settings.issueGASFee),
    };
  }

  private async capture<T>(func: (monitor?: Monitor) => Promise<T>, name: string, monitor?: Monitor): Promise<T> {
    if (monitor === undefined) {
      return func();
    }

    return monitor.at('neo_one_data_provider').captureSpanLog(func, {
      name,
      level: { log: 'verbose', span: 'info' },
      trace: true,
    });
  }
}
