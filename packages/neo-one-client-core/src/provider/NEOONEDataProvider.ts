/// <reference types="@reactivex/ix-es2015-cjs" />
import {
  Account,
  AddressString,
  ApplicationLogJSON,
  Attribute,
  AttributeJSON,
  AttributeTypeModel,
  Block,
  BlockJSON,
  ConfirmedTransaction,
  Contract,
  ContractABI,
  ContractABIJSON,
  ContractEventDescriptor,
  ContractEventDescriptorJSON,
  ContractGroup,
  ContractGroupJSON,
  ContractJSON,
  ContractManifest,
  ContractManifestJSON,
  ContractMethodDescriptor,
  ContractMethodDescriptorJSON,
  ContractParameterDefinition,
  ContractParameterDefinitionJSON,
  ContractParameterDefinitionType,
  ContractParameterTypeJSON,
  ContractPermission,
  ContractPermissionJSON,
  DeveloperProvider,
  ExecutionJSON,
  GetOptions,
  Hash256String,
  IterOptions,
  JSONHelper,
  NetworkSettings,
  NetworkSettingsJSON,
  NetworkType,
  OracleResponseJSON,
  Peer,
  PrivateNetworkSettings,
  RawApplicationLogData,
  RawCallReceipt,
  RawExecutionData,
  RelayTransactionResult,
  RelayTransactionResultJSON,
  ScriptBuilderParam,
  scriptHashToAddress,
  Signer,
  SignerJSON,
  StorageItem,
  StorageItemJSON,
  toAttributeType,
  toVerifyResult,
  Transaction,
  TransactionJSON,
  TransactionModel,
  TransactionReceipt,
  TransactionReceiptJSON,
  UInt160Hex,
  VerifyResultJSON,
  VerifyResultModel,
} from '@neo-one/client-common';
import { utils as commonUtils } from '@neo-one/utils';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { flatten } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/flatten';
import { map } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/map';
import BigNumber from 'bignumber.js';
import debug from 'debug';
import { AsyncBlockIterator } from '../AsyncBlockIterator';
import { clientUtils } from '../clientUtils';
import { convertCallReceipt, convertLog, convertNotification, convertStackItem } from './convert';
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

  public async getUnclaimed(address: AddressString): Promise<BigNumber> {
    return this.capture(async () => {
      const result = await this.mutableClient.getUnclaimedGas(address);

      return new BigNumber(result.unclaimed);
    }, 'neo_get_unclaimed');
  }

  public async relayTransaction(transaction: TransactionModel): Promise<RelayTransactionResult> {
    const result = await this.mutableClient.relayTransaction(transaction.serializeWire().toString('hex'));

    return this.convertRelayTransactionResult(result);
  }

  public async getTransactionReceipt(hash: Hash256String, options?: GetOptions): Promise<TransactionReceipt> {
    const result = await this.mutableClient.getTransactionReceipt(hash, options);

    return { ...result, globalIndex: new BigNumber(result.globalIndex) };
  }

  public async getApplicationLogData(hash: Hash256String): Promise<RawApplicationLogData> {
    const applicationLogData = await this.mutableClient.getApplicationLog(hash);

    return this.convertApplicationLogData(applicationLogData);
  }

  public async testInvoke(script: Buffer): Promise<RawCallReceipt> {
    const receipt = await this.mutableClient.testInvokeRaw(script.toString('base64'));

    return convertCallReceipt(receipt);
  }

  public async testTransaction(transaction: TransactionModel): Promise<RawCallReceipt> {
    const receipt = await this.mutableClient.testTransaction(transaction.serializeWire().toString('hex'));

    return convertCallReceipt(receipt);
  }

  public async getBlock(hashOrIndex: Hash256String | number, options?: GetOptions): Promise<Block> {
    const block = await this.mutableClient.getBlock(hashOrIndex, options);

    return this.convertBlock(block);
  }

  public async getFeePerByte(): Promise<BigNumber> {
    const feePerByte = await this.mutableClient.getFeePerByte();

    return new BigNumber(feePerByte);
  }

  public async getExecFeeFactor(): Promise<number> {
    return this.mutableClient.getExecFeeFactor();
  }

  public async getVerificationCost(
    hash: AddressString,
    transaction: TransactionModel,
  ): Promise<{
    readonly fee: BigNumber;
    readonly size: number;
  }> {
    const result = await this.mutableClient.getVerificationCost(hash, transaction.serializeWire().toString('hex'));

    return {
      fee: new BigNumber(result.fee),
      size: result.size,
    };
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

  public async getMemPool(): Promise<{ readonly height: number; readonly verified: readonly Hash256String[] }> {
    return this.mutableClient.getMemPool();
  }

  public async getTransaction(hash: Hash256String): Promise<Transaction> {
    const transaction = await this.mutableClient.getTransaction(hash);

    return this.convertTransaction(transaction);
  }

  public async getConnectedPeers(): Promise<readonly Peer[]> {
    return this.mutableClient.getConnectedPeers();
  }

  public async getNetworkSettings(): Promise<NetworkSettings> {
    const settings = await this.mutableClient.getNetworkSettings();

    return this.convertNetworkSettings(settings);
  }

  public async call(
    contract: UInt160Hex,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
  ): Promise<RawCallReceipt> {
    const script = clientUtils.getInvokeMethodScript({
      scriptHash: contract,
      method,
      params,
    });

    return this.testInvoke(script);
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

  public async getNEOTrackerURL(): Promise<string | undefined> {
    return this.mutableClient.getNEOTrackerURL();
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

  public async getAccount(address: AddressString): Promise<Account> {
    const balances = await this.mutableClient.getNep17Balances(address);

    return {
      address,
      balances: balances.balance.reduce<Account['balances']>(
        (acc, { assethash, amount }) => ({
          ...acc,
          [assethash]: new BigNumber(amount),
        }),
        {},
      ),
    };
  }

  private convertStorageItem(storageItem: StorageItemJSON): StorageItem {
    return {
      key: storageItem.key,
      value: storageItem.value,
    };
  }

  private convertBlock(block: BlockJSON): Block {
    return {
      header: {
        version: block.version,
        hash: block.hash,
        previousBlockHash: block.previousblockhash,
        merkleRoot: block.merkleroot,
        time: new BigNumber(block.time),
        primaryIndex: block.primary,
        index: block.index,
        nextConsensus: block.nextconsensus,
        witness: block.witnesses[0],
        witnesses: block.witnesses,
        size: block.size,
      },
      transactions: block.tx.map((transaction) => this.convertConfirmedTransaction(transaction)),
    };
  }

  private convertTransaction(transaction: TransactionJSON): Transaction {
    return {
      version: transaction.version,
      nonce: transaction.nonce,
      sender: transaction.sender ? transaction.sender : undefined,
      hash: transaction.hash,
      size: transaction.size,
      validUntilBlock: transaction.validuntilblock,
      attributes: this.convertAttributes(transaction.attributes),
      systemFee: new BigNumber(transaction.sysfee),
      networkFee: new BigNumber(transaction.netfee),
      signers: transaction.signers.map((signer) => this.convertSigner(signer)),
      script: transaction.script,
      witnesses: transaction.witnesses,
    };
  }

  private convertTransactionReceipt(receipt: TransactionReceiptJSON): TransactionReceipt {
    return {
      blockIndex: receipt.blockIndex,
      blockHash: receipt.blockHash,
      blockTime: receipt.blockTime,
      transactionHash: receipt.transactionHash,
      globalIndex: JSONHelper.readUInt64(receipt.globalIndex),
      confirmations: receipt.confirmations,
      transactionIndex: receipt.transactionIndex,
    };
  }

  private convertSigner(signer: SignerJSON): Signer {
    return {
      account: scriptHashToAddress(signer.account),
      scopes: signer.scopes,
      allowedContracts: signer.allowedcontracts?.map(scriptHashToAddress),
      allowedGroups: signer.allowedgroups,
    };
  }

  private convertConfirmedTransaction(transaction: TransactionJSON): ConfirmedTransaction {
    return {
      ...this.convertTransaction(transaction),
      receipt: transaction.receipt ? this.convertTransactionReceipt(transaction.receipt) : undefined,
    };
  }

  private convertAttributes(attributes: readonly AttributeJSON[]): readonly Attribute[] {
    return attributes.map(this.convertAttribute);
  }

  private convertAttribute(attribute: AttributeJSON): Attribute {
    const type = toAttributeType(attribute.type);
    switch (type) {
      case AttributeTypeModel.HighPriority:
        return {
          type,
        };
      case AttributeTypeModel.OracleResponse:
        // tslint:disable-next-line: no-any we know this is true but TS is being mean
        const oracleJSON = attribute as OracleResponseJSON;

        return {
          type,
          id: new BigNumber(oracleJSON.id),
          code: oracleJSON.code,
          result: oracleJSON.result,
        };
      default:
        throw new Error();
    }
  }

  private convertContract(contract: ContractJSON): Contract {
    return {
      id: contract.id,
      script: contract.nef.script,
      hash: contract.hash,
      manifest: this.convertContractManifest(contract.manifest),
    };
  }

  private convertContractManifest(manifest: ContractManifestJSON): ContractManifest {
    return {
      name: manifest.name,
      groups: manifest.groups.map(this.convertContractGroup),
      supportedStandards: manifest.supportedstandards,
      abi: this.convertContractABI(manifest.abi),
      permissions: manifest.permissions.map(this.convertContractPermission),
      trusts: manifest.trusts,
      extra: manifest.extra,
    };
  }

  private convertContractGroup(group: ContractGroupJSON): ContractGroup {
    return {
      publicKey: group.publicKey,
      signature: group.signature,
    };
  }

  private convertContractPermission(permission: ContractPermissionJSON): ContractPermission {
    return {
      contract: permission.contract,
      methods: permission.methods,
    };
  }

  private convertContractABI(abi: ContractABIJSON): ContractABI {
    return {
      methods: abi.methods.map(this.convertContractMethodDescriptor.bind(this)),
      events: abi.events.map(this.convertContractEventDescriptor.bind(this)),
    };
  }

  private convertContractEventDescriptor(event: ContractEventDescriptorJSON): ContractEventDescriptor {
    return {
      name: event.name,
      parameters: event.parameters.map(this.convertContractParameterDefinition.bind(this)),
    };
  }

  private convertContractMethodDescriptor(method: ContractMethodDescriptorJSON): ContractMethodDescriptor {
    return {
      name: method.name,
      parameters: method.parameters.map(this.convertContractParameterDefinition.bind(this)),
      returnType: this.convertContractParameterType(method.returntype),
      offset: method.offset,
    };
  }

  private convertContractParameterDefinition(param: ContractParameterDefinitionJSON): ContractParameterDefinition {
    return {
      type: this.convertContractParameterType(param.type),
      name: param.name,
    };
  }

  private convertContractParameterType(param: ContractParameterTypeJSON): ContractParameterDefinitionType {
    switch (param) {
      case 'Any':
        return 'Any';
      case 'Signature':
        return 'Signature';
      case 'Boolean':
        return 'Boolean';
      case 'Integer':
        return 'Integer';
      case 'Hash160':
        return 'Hash160';
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

  private convertExecution(data: ExecutionJSON): RawExecutionData {
    return {
      trigger: data.trigger,
      vmState: data.vmstate,
      gasConsumed: new BigNumber(data.gasconsumed),
      stack: typeof data.stack === 'string' ? data.stack : data.stack.map(convertStackItem),
      notifications: data.notifications.map(convertNotification),
      logs: data.logs.map(convertLog),
    };
  }

  private convertApplicationLogData(data: ApplicationLogJSON): RawApplicationLogData {
    return {
      txId: data.txid,
      blockHash: data.blockhash,
      executions: data.executions.map(this.convertExecution),
    };
  }

  private convertNetworkSettings(settings: NetworkSettingsJSON): NetworkSettings {
    return {
      blockCount: settings.blockcount,
      decrementInterval: settings.decrementinterval,
      generationAmount: settings.generationamount,
      privateKeyVersion: settings.privatekeyversion,
      standbyvalidators: settings.standbyvalidators,
      messageMagic: settings.messagemagic,
      addressVersion: settings.addressversion,
      standbyCommittee: settings.standbycommittee,
      committeeMemberscount: settings.committeememberscount,
      validatorsCount: settings.validatorscount,
      millisecondsPerBlock: settings.millisecondsperblock,
      memoryPoolMaxTransactions: settings.memorypoolmaxtransactions,
    };
  }

  private convertRelayTransactionResult(result: RelayTransactionResultJSON): RelayTransactionResult {
    const transaction = this.convertTransaction(result.transaction);
    const verifyResult = result.verifyResult === undefined ? undefined : this.convertVerifyResult(result.verifyResult);

    return { transaction, verifyResult };
  }

  /* istanbul ignore next */
  private convertVerifyResult(result: VerifyResultJSON): VerifyResultModel {
    return toVerifyResult(result);
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
