/// <reference types="@reactivex/ix-es2015-cjs" />
import {
  Account,
  AccountJSON,
  AddressString,
  Asset,
  AssetJSON,
  AssetType,
  AssetTypeJSON,
  Attribute,
  AttributeJSON,
  Block,
  BlockJSON,
  common,
  ConfirmedTransaction,
  Contract,
  ContractJSON,
  ContractParameterType,
  ContractParameterTypeJSON,
  DeveloperProvider,
  GetOptions,
  Hash256String,
  Input,
  InputJSON,
  InputOutput,
  InvocationDataJSON,
  InvocationTransactionJSON,
  InvocationTransactionModel,
  IterOptions,
  JSONHelper,
  NetworkSettings,
  NetworkSettingsJSON,
  NetworkType,
  Output,
  OutputJSON,
  Peer,
  PrivateNetworkSettings,
  RawAction,
  RawCallReceipt,
  RawInvocationData,
  RawStorageChange,
  RelayTransactionResult,
  RelayTransactionResultJSON,
  ScriptBuilderParam,
  scriptHashToAddress,
  StorageChangeJSON,
  StorageItem,
  StorageItemJSON,
  Transaction,
  TransactionBase,
  TransactionJSON,
  TransactionReceipt,
  utils,
  VerifyTransactionResult,
  VerifyTransactionResultJSON,
} from '@neo-one/client-common';
import { Configuration, utils as commonUtils } from '@neo-one/utils';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { flatMap } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/flatmap';
import { flatten } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/flatten';
import { map } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/map';
import BigNumber from 'bignumber.js';
import debug from 'debug';
import _ from 'lodash';
import { AsyncBlockIterator } from '../AsyncBlockIterator';
import { clientUtils } from '../clientUtils';
import { MissingTransactionDataError } from '../errors';
import { convertAction, convertCallReceipt, convertInvocationResult } from './convert';
import { JSONRPCClient } from './JSONRPCClient';
import { JSONRPCHTTPProvider } from './JSONRPCHTTPProvider';
import { JSONRPCProvider, JSONRPCProviderManager } from './JSONRPCProvider';

const logger = debug('NEOONE:DataProvider');

export interface NEOONEDataProviderOptions {
  readonly network: NetworkType;
  readonly rpcURL: string | JSONRPCProvider | JSONRPCProviderManager;
  readonly iterBlocksFetchTimeoutMS?: number;
  readonly iterBlocksBatchSize?: number;
}

/**
 * Implements the methods required by the `NEOONEProvider` as well as the `DeveloperProvider` interface using a NEO•ONE node.
 */
export class NEOONEDataProvider implements DeveloperProvider {
  public readonly network: NetworkType;
  private mutableClient: JSONRPCClient;
  private readonly iterBlocksFetchTimeoutMS: number | undefined;
  private readonly iterBlocksBatchSize: number | undefined;

  public constructor({ network, rpcURL, iterBlocksFetchTimeoutMS, iterBlocksBatchSize }: NEOONEDataProviderOptions) {
    this.network = network;
    this.mutableClient = new JSONRPCClient(typeof rpcURL === 'string' ? new JSONRPCHTTPProvider(rpcURL) : rpcURL);
    this.iterBlocksFetchTimeoutMS = iterBlocksFetchTimeoutMS;
    this.iterBlocksBatchSize = iterBlocksBatchSize;
  }

  public setRPCURL(rpcURL: string): void {
    this.mutableClient = new JSONRPCClient(new JSONRPCHTTPProvider(rpcURL));
  }

  public async getUnclaimed(
    address: AddressString,
  ): Promise<{ readonly unclaimed: readonly Input[]; readonly amount: BigNumber }> {
    return this.capture(async () => {
      const account = await this.getAccountInternal(address);
      const amounts = await Promise.all(
        account.unclaimed.map(async (input) => this.mutableClient.getClaimAmount(input)),
      );

      return {
        unclaimed: this.convertInputs(account.unclaimed),
        amount: amounts.reduce((acc, amount) => acc.plus(amount), utils.ZERO_BIG_NUMBER),
      };
    }, 'neo_get_unclaimed');
  }

  public async getClaimAmount(input: Input): Promise<BigNumber> {
    return this.capture(
      async () => this.mutableClient.getClaimAmount({ txid: input.hash, vout: input.index }),
      'neo_get_claim_amount',
    );
  }

  public async getUnspentOutputs(address: AddressString): Promise<readonly InputOutput[]> {
    return this.capture(async () => {
      const account = await this.getAccountInternal(address);
      const outputs = await Promise.all(
        account.unspent.map(
          async (input): Promise<InputOutput | undefined> => {
            const outputJSON = await this.mutableClient.getUnspentOutput(input);

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
    }, 'neo_get_unspent');
  }

  public async relayTransaction(transaction: string): Promise<RelayTransactionResult> {
    const result = await this.mutableClient.relayTransaction(transaction);

    return this.convertRelayTransactionResult(result);
  }

  public async getTransactionReceipt(hash: Hash256String, options?: GetOptions): Promise<TransactionReceipt> {
    const result = await this.mutableClient.getTransactionReceipt(hash, options);

    return { ...result, globalIndex: new BigNumber(result.globalIndex) };
  }

  public async getInvocationData(hash: Hash256String): Promise<RawInvocationData> {
    const [invocationData, transaction] = await Promise.all([
      this.mutableClient.getInvocationData(hash),
      this.mutableClient.getTransaction(hash),
    ]);

    if (transaction.data === undefined) {
      throw new MissingTransactionDataError(hash);
    }

    return this.convertInvocationData(
      invocationData,
      transaction.data.blockHash,
      transaction.data.blockIndex,
      hash,
      transaction.data.transactionIndex,
    );
  }

  public async testInvoke(transaction: string): Promise<RawCallReceipt> {
    const receipt = await this.mutableClient.testInvocation(transaction);

    return convertCallReceipt(receipt);
  }

  public async getAccount(address: AddressString): Promise<Account> {
    const account = await this.getAccountInternal(address);

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

  public async getAsset(hash: Hash256String): Promise<Asset> {
    const asset = await this.mutableClient.getAsset(hash);

    return this.convertAsset(asset);
  }

  public async getBlock(hashOrIndex: Hash256String | number, options?: GetOptions): Promise<Block> {
    const block = await this.mutableClient.getBlock(hashOrIndex, options);

    return this.convertBlock(block);
  }

  public iterBlocks(options: IterOptions = {}): AsyncIterable<Block> {
    return AsyncIterableX.from(
      new AsyncBlockIterator({
        client: this,
        options,
        fetchTimeoutMS: this.iterBlocksFetchTimeoutMS,
        batchSize: this.iterBlocksBatchSize,
      }),
    );
  }

  public async getBestBlockHash(): Promise<Hash256String> {
    return this.mutableClient.getBestBlockHash();
  }

  public async getBlockCount(): Promise<number> {
    return this.mutableClient.getBlockCount();
  }

  public async getContract(address: AddressString): Promise<Contract> {
    const contract = await this.mutableClient.getContract(address);

    return this.convertContract(contract);
  }

  public async getMemPool(): Promise<readonly Hash256String[]> {
    return this.mutableClient.getMemPool();
  }

  public async getTransaction(hash: Hash256String): Promise<Transaction> {
    const transaction = await this.mutableClient.getTransaction(hash);

    return this.convertTransaction(transaction);
  }

  public async getOutput(input: Input): Promise<Output> {
    const output = await this.mutableClient.getOutput({
      txid: input.hash,
      vout: input.index,
    });

    return this.convertOutput(output);
  }

  public async getConnectedPeers(): Promise<readonly Peer[]> {
    return this.mutableClient.getConnectedPeers();
  }

  public async getNetworkSettings(): Promise<NetworkSettings> {
    const settings = await this.mutableClient.getNetworkSettings();

    return this.convertNetworkSettings(settings);
  }

  public iterActionsRaw(options: IterOptions = {}): AsyncIterable<RawAction> {
    return AsyncIterableX.from(this.iterBlocks(options)).pipe<RawAction>(
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
  ): Promise<RawCallReceipt> {
    const testTransaction = new InvocationTransactionModel({
      version: 1,
      gas: common.TEN_THOUSAND_FIXED8,
      script: clientUtils.getInvokeMethodScript({
        address: contract,
        method,
        params,
      }),
    });

    return this.testInvoke(testTransaction.serializeWire().toString('hex'));
  }

  public async runConsensusNow(): Promise<void> {
    return this.mutableClient.runConsensusNow();
  }

  public async updateSettings(options: Partial<PrivateNetworkSettings>): Promise<void> {
    return this.mutableClient.updateSettings(options);
  }

  public async getSettings(): Promise<PrivateNetworkSettings> {
    return this.mutableClient.getSettings();
  }

  public async fastForwardOffset(seconds: number): Promise<void> {
    return this.mutableClient.fastForwardOffset(seconds);
  }

  public async fastForwardToTime(seconds: number): Promise<void> {
    return this.mutableClient.fastForwardToTime(seconds);
  }

  public async reset(): Promise<void> {
    return this.mutableClient.reset();
  }

  public async getProjectConfiguration(): Promise<Configuration | undefined> {
    return this.mutableClient.getProjectConfiguration();
  }

  public async resetProject(): Promise<void> {
    return this.mutableClient.resetProject();
  }

  public iterStorage(address: AddressString): AsyncIterable<StorageItem> {
    return AsyncIterableX.from(this.mutableClient.getAllStorage(address).then((res) => AsyncIterableX.from(res))).pipe(
      // tslint:disable-next-line no-any
      flatten<StorageItem>() as any,
      map<StorageItemJSON, StorageItem>((storageItem) => this.convertStorageItem(storageItem)),
    );
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
      /* istanbul ignore next */
      (converted) => converted,
    );
  }

  private convertConfirmedTransaction(transaction: TransactionJSON): ConfirmedTransaction {
    if (transaction.data === undefined) {
      /* istanbul ignore next */
      throw new Error('Unexpected undefined data');
    }
    const data = {
      blockHash: transaction.data.blockHash,
      blockIndex: transaction.data.blockIndex,
      transactionIndex: transaction.data.transactionIndex,
      globalIndex: JSONHelper.readUInt64(transaction.data.globalIndex),
    };

    return this.convertTransactionBase(
      transaction,
      (invocation, transactionBase) => {
        /* istanbul ignore next */
        if (invocation.invocationData === undefined || transaction.data === undefined) {
          throw new Error('Unexpected undefined data');
        }

        const invocationData = this.convertInvocationData(
          invocation.invocationData,
          transaction.data.blockHash,
          transaction.data.blockIndex,
          transaction.txid,
          transaction.data.transactionIndex,
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
            name: Array.isArray(transaction.asset.name)
              ? /* istanbul ignore next */ transaction.asset.name[0].name
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
        };
        break;
      /* istanbul ignore next */
      default:
        commonUtils.assertNever(transaction);
        throw new Error('For TS');
    }

    return convertTransaction(converted);
  }

  private convertAttributes(attributes: readonly AttributeJSON[]): readonly Attribute[] {
    return attributes.map((attribute) => ({
      // tslint:disable-next-line no-any
      usage: attribute.usage as any,
      data: attribute.usage === 'Script' ? scriptHashToAddress(attribute.data) : attribute.data,
    }));
  }

  private convertInputs(inputs: readonly InputJSON[]): readonly Input[] {
    return inputs.map((input) => this.convertInput(input));
  }

  private convertInput(input: InputJSON): Input {
    return {
      hash: input.txid,
      index: input.vout,
    };
  }

  private convertOutputs(outputs: readonly OutputJSON[]): readonly Output[] {
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
      case 'Map':
        return 'Map';
      case 'InteropInterface':
        return 'InteropInterface';
      case 'Void':
        return 'Void';
      /* istanbul ignore next */
      default:
        commonUtils.assertNever(param);
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
      migratedContractAddresses: data.migratedContractHashes.map<readonly [AddressString, AddressString]>(
        ([hash0, hash1]) => [scriptHashToAddress(hash0), scriptHashToAddress(hash1)] as const,
      ),
      actions: data.actions.map((action, idx) =>
        convertAction(blockHash, blockIndex, transactionHash, transactionIndex, idx, action),
      ),
      storageChanges: data.storageChanges.map((storageChange) => this.convertStorageChange(storageChange)),
    };
  }

  private convertStorageChange(storageChange: StorageChangeJSON): RawStorageChange {
    if (storageChange.type === 'Add') {
      return {
        type: 'Add',
        address: scriptHashToAddress(storageChange.hash),
        key: storageChange.key,
        value: storageChange.value,
      };
    }

    if (storageChange.type === 'Modify') {
      return {
        type: 'Modify',
        address: scriptHashToAddress(storageChange.hash),
        key: storageChange.key,
        value: storageChange.value,
      };
    }

    return {
      type: 'Delete',
      address: scriptHashToAddress(storageChange.hash),
      key: storageChange.key,
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

  private async getAccountInternal(address: AddressString): Promise<AccountJSON> {
    return this.mutableClient.getAccount(address);
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

  /* istanbul ignore next */
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

  private async capture<T>(func: () => Promise<T>, title: string): Promise<T> {
    try {
      const result = await func();
      logger('%o', { level: 'debug', title });

      return result;
    } catch (error) {
      logger('%o', { level: 'error', title, error: error.message });
      throw error;
    }
  }
}
