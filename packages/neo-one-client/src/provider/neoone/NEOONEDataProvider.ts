import {
  AccountJSON,
  AssetJSON,
  AssetTypeJSON,
  AttributeJSON,
  BlockJSON,
  common,
  ContractJSON,
  ContractParameterTypeJSON,
  convertAction,
  convertCallReceipt,
  convertInvocationResult,
  InputJSON,
  InvocationDataJSON,
  InvocationTransaction as CoreInvocationTransaction,
  InvocationTransactionJSON,
  JSONHelper,
  NetworkSettingsJSON,
  OutputJSON,
  RelayTransactionResultJSON,
  ScriptBuilderParam,
  StorageItemJSON,
  TransactionJSON,
  utils,
  VerifyTransactionResultJSON,
} from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import { utils as commonUtils } from '@neo-one/utils';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { flatMap } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/flatmap';
import { flatten } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/flatten';
import { map } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/map';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { AsyncBlockIterator } from '../../AsyncBlockIterator';
import { scriptHashToAddress } from '../../helpers';
import {
  Account,
  AddressString,
  Asset,
  AssetType,
  Attribute,
  Block,
  BlockFilter,
  BufferString,
  ConfirmedTransaction,
  Contract,
  ContractParameterType,
  DataProvider,
  DeveloperProvider,
  GetOptions,
  Hash256String,
  Input,
  InputOutput,
  NetworkSettings,
  NetworkType,
  Output,
  Peer,
  PrivateNetworkSettings,
  RawAction,
  RawCallReceipt,
  RawInvocationData,
  RelayTransactionResult,
  StorageItem,
  Transaction,
  TransactionBase,
  TransactionReceipt,
  VerifyTransactionResult,
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
          unclaimed: this.convertInputs(account.unclaimed),
          amount: amounts.reduce((acc, amount) => acc.plus(amount), utils.ZERO_BIG_NUMBER),
        };
      },
      'neo_get_unclaimed',
      monitor,
    );
  }

  public async getClaimAmount(input: Input, monitor?: Monitor): Promise<BigNumber> {
    return this.capture(
      async (span) => this.mutableClient.getClaimAmount({ txid: input.hash, vout: input.index }, span),
      'neo_get_claim_amount',
      monitor,
    );
  }

  public async getUnspentOutputs(address: AddressString, monitor?: Monitor): Promise<ReadonlyArray<InputOutput>> {
    return this.capture(
      async (span) => {
        const account = await this.getAccountInternal(address, span);
        const outputs = await Promise.all(
          account.unspent.map(
            async (input): Promise<InputOutput | undefined> => {
              const outputJSON = await this.mutableClient.getUnspentOutput(input, span);

              if (outputJSON === undefined) {
                return undefined;
              }

              const output = this.convertOutput(outputJSON);

              return {
                asset: output.asset,
                value: output.value,
                address: output.address,
                hash: input.txid,
                index: input.vout,
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

  public async relayTransaction(transaction: string, monitor?: Monitor): Promise<RelayTransactionResult> {
    const result = await this.mutableClient.relayTransaction(transaction, monitor);

    return this.convertRelayTransactionResult(result);
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

  public async getContract(address: AddressString, monitor?: Monitor): Promise<Contract> {
    const contract = await this.mutableClient.getContract(address, monitor);

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
    const output = await this.mutableClient.getOutput(
      {
        txid: input.hash,
        vout: input.index,
      },
      monitor,
    );

    return this.convertOutput(output);
  }

  public async getConnectedPeers(monitor?: Monitor): Promise<ReadonlyArray<Peer>> {
    return this.mutableClient.getConnectedPeers(monitor);
  }

  public async getNetworkSettings(monitor?: Monitor): Promise<NetworkSettings> {
    const settings = await this.mutableClient.getNetworkSettings(monitor);

    return this.convertNetworkSettings(settings);
  }

  public async getStorage(address: AddressString, key: BufferString, monitor?: Monitor): Promise<StorageItem> {
    const storageItem = await this.mutableClient.getStorageItem(address, key, monitor);

    return this.convertStorageItem(storageItem);
  }

  public iterStorage(address: AddressString, monitor?: Monitor): AsyncIterable<StorageItem> {
    return AsyncIterableX.from(
      this.mutableClient.getAllStorage(address, monitor).then((res) => AsyncIterableX.from(res)),
    ).pipe(
      // tslint:disable-next-line no-any
      flatten<StorageItem>() as any,
      map<StorageItemJSON, StorageItem>((storageItem) => this.convertStorageItem(storageItem)),
    );
  }

  public iterActionsRaw(filter: BlockFilter = {}): AsyncIterable<RawAction> {
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
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ): Promise<RawCallReceipt> {
    const testTransaction = new CoreInvocationTransaction({
      version: 1,
      gas: common.TEN_THOUSAND_FIXED8,
      script: clientUtils.getInvokeMethodScript({
        address: contract,
        method,
        params,
      }),
    });

    return this.testInvoke(testTransaction.serializeWire().toString('hex'), monitor);
  }

  public async runConsensusNow(monitor?: Monitor): Promise<void> {
    return this.mutableClient.runConsensusNow(monitor);
  }

  public async updateSettings(options: Partial<PrivateNetworkSettings>, monitor?: Monitor): Promise<void> {
    return this.mutableClient.updateSettings(options, monitor);
  }

  public async getSettings(monitor?: Monitor): Promise<PrivateNetworkSettings> {
    return this.mutableClient.getSettings(monitor);
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

  private convertStorageItem(storageItem: StorageItemJSON): StorageItem {
    return {
      address: scriptHashToAddress(storageItem.hash),
      key: storageItem.key,
      value: storageItem.value,
    };
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
          receipt: data,
          invocationData,
        };
      },
      // tslint:disable-next-line no-any
      (converted) => ({ ...converted, receipt: data } as any),
    );
  }

  private convertTransactionBase<Result extends Transaction | ConfirmedTransaction>(
    transaction: TransactionJSON,
    convertInvocation: (invocation: InvocationTransactionJSON, transactionBase: TransactionBase) => Result,
    convertTransaction: (transaction: Transaction) => Result,
  ): Result {
    const transactionBase = {
      hash: transaction.txid,
      size: transaction.size,
      version: transaction.version,
      attributes: this.convertAttributes(transaction.attributes),
      inputs: this.convertInputs(transaction.vin),
      outputs: this.convertOutputs(transaction.vout),
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
          claims: this.convertInputs(transaction.claims),
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
            type: this.convertAssetType(transaction.asset.type),
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
        };
        break;
      default:
        /* istanbul ignore next */
        commonUtils.assertNever(transaction);
        /* istanbul ignore next */
        throw new Error('For TS');
    }

    return convertTransaction(converted);
  }

  private convertAttributes(attributes: ReadonlyArray<AttributeJSON>): ReadonlyArray<Attribute> {
    return attributes.map((attribute) => ({
      // tslint:disable-next-line no-any
      usage: attribute.usage as any,
      data: attribute.usage === 'Script' ? scriptHashToAddress(attribute.data) : attribute.data,
    }));
  }

  private convertInputs(inputs: ReadonlyArray<InputJSON>): ReadonlyArray<Input> {
    return inputs.map((input) => this.convertInput(input));
  }

  private convertInput(input: InputJSON): Input {
    return {
      hash: input.txid,
      index: input.vout,
    };
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
      address: scriptHashToAddress(contract.hash),
      script: contract.script,
      parameters: contract.parameters.map((param) => this.convertContractParameterType(param)),
      returnType: this.convertContractParameterType(contract.returntype),
      name: contract.name,
      codeVersion: contract.code_version,
      author: contract.author,
      email: contract.email,
      description: contract.description,
      storage: contract.properties.storage,
      dynamicInvoke: contract.properties.dynamic_invoke,
      payable: contract.properties.payable,
    };
  }

  private convertContractParameterType(param: ContractParameterTypeJSON): ContractParameterType {
    switch (param) {
      case 'Signature':
        return 'Signature';
      case 'Boolean':
        return 'Boolean';
      case 'Integer':
        return 'Integer';
      case 'Hash160':
        return 'Address';
      case 'Hash256':
        return 'Hash256';
      case 'ByteArray':
        return 'Buffer';
      case 'PublicKey':
        return 'PublicKey';
      case 'String':
        return 'String';
      case 'Array':
        return 'Array';
      case 'InteropInterface':
        return 'InteropInterface';
      case 'Void':
        return 'Void';
      default:
        /* istanbul ignore next */
        commonUtils.assertNever(param);
        /* istanbul ignore next */
        throw new Error('For TS');
    }
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
      deletedContractAddresses: data.deletedContractHashes.map(scriptHashToAddress),
      migratedContractAddresses: data.migratedContractHashes.map<[AddressString, AddressString]>(([hash0, hash1]) => [
        scriptHashToAddress(hash0),
        scriptHashToAddress(hash1),
      ]),
      actions: data.actions.map((action, idx) =>
        convertAction(blockHash, blockIndex, transactionHash, transactionIndex, idx, action),
      ),
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
      type: this.convertAssetType(asset.type),
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

  private convertAssetType(assetType: AssetTypeJSON): AssetType {
    switch (assetType) {
      case 'CreditFlag':
        return 'Credit';
      case 'DutyFlag':
        return 'Duty';
      case 'GoverningToken':
        return 'Governing';
      case 'UtilityToken':
        return 'Utility';
      case 'Currency':
        return 'Currency';
      case 'Share':
        return 'Share';
      case 'Invoice':
        return 'Invoice';
      case 'Token':
        return 'Token';
      default:
        /* istanbul ignore next */
        commonUtils.assertNever(assetType);
        /* istanbul ignore next */
        throw new Error('For TS');
    }
  }

  private async getAccountInternal(address: AddressString, monitor?: Monitor): Promise<AccountJSON> {
    return this.mutableClient.getAccount(address, monitor);
  }

  private convertNetworkSettings(settings: NetworkSettingsJSON): NetworkSettings {
    return {
      issueGASFee: new BigNumber(settings.issueGASFee),
    };
  }

  private convertRelayTransactionResult(result: RelayTransactionResultJSON): RelayTransactionResult {
    const transaction = this.convertTransaction(result.transaction);
    const verifyResult =
      result.verifyResult === undefined ? undefined : this.convertVerifyResult(transaction.hash, result.verifyResult);

    return { transaction, verifyResult };
  }

  private convertVerifyResult(transactionHash: string, result: VerifyTransactionResultJSON): VerifyTransactionResult {
    return {
      verifications: result.verifications.map((verification) => ({
        failureMessage: verification.failureMessage,
        witness: verification.witness,
        address: scriptHashToAddress(verification.hash),
        actions: verification.actions.map((action, idx) =>
          convertAction(
            common.uInt256ToString(common.bufferToUInt256(Buffer.alloc(32, 0))),
            -1,
            transactionHash,
            -1,
            idx,
            action,
          ),
        ),
      })),
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
