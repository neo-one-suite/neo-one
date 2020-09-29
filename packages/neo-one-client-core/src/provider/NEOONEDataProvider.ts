/// <reference types="@reactivex/ix-es2015-cjs" />
import {
  AddressString,
  Attribute,
  AttributeJSON,
  Block,
  BlockJSON,
  common,
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
  ContractParameterType,
  ContractParameterTypeJSON,
  ContractPermission,
  ContractPermissionDescriptor,
  ContractPermissionDescriptorJSON,
  ContractPermissionJSON,
  DeveloperProvider,
  GetOptions,
  Hash256String,
  InvocationDataJSON,
  IterOptions,
  JSONHelper,
  NetworkSettings,
  NetworkSettingsJSON,
  NetworkType,
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
  Signer,
  SignerJSON,
  StorageChangeJSON,
  StorageItem,
  StorageItemJSON,
  toAttributeType,
  Transaction,
  TransactionJSON,
  TransactionModel,
  TransactionReceipt,
  TransactionReceiptJSON,
  TransactionWithInvocationDataJSON,
  utils,
  VerifyTransactionResult,
  VerifyTransactionResultJSON,
  WildcardContainer,
  WildcardContainerJSON,
} from '@neo-one/client-common';
import { utils as commonUtils } from '@neo-one/utils';
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

  public async testInvoke(transaction: TransactionModel): Promise<RawCallReceipt> {
    const receipt = await this.mutableClient.testInvocation(transaction.serializeWire().toString('hex'));

    return convertCallReceipt(receipt);
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
        const actions = _.flatten(block.transactions.map((transaction) => [...transaction?.invocationData?.actions]));

        return AsyncIterableX.of(...actions);
      }),
    );
  }

  public async call(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
  ): Promise<RawCallReceipt> {
    const testTransaction = new TransactionModel({
      systemFee: utils.ZERO, // TODO: need to get the systemFee?
      script: clientUtils.getInvokeMethodScript({
        address: contract,
        method,
        params,
      }),
    });

    return this.testInvoke(testTransaction);
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
      time: new BigNumber(block.time),
      consensusData:
        block.consensusdata === undefined // TODO: check
          ? undefined
          : {
              primaryIndex: block.consensusdata.primary,
              nonce: block.consensusdata.nonce,
            },
      index: block.index,
      nextConsensus: block.nextconsensus,
      witness: block.witnesses[0],
      witnesses: block.witnesses,
      size: block.size,
      transactions: block.tx.map((transaction) => this.convertConfirmedTransaction(transaction)),
    };
  }

  private convertTransaction(transaction: TransactionJSON): Transaction {
    return {
      version: transaction.version,
      nonce: transaction.nonce,
      sender: scriptHashToAddress(transaction.sender),
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
      allowedGroups: signer.allowedgroups?.map((group) => common.stringToECPoint(group)), // TODO: check
    };
  }

  private convertConfirmedTransaction(transaction: TransactionWithInvocationDataJSON): ConfirmedTransaction {
    if (transaction.data === undefined) {
      /* istanbul ignore next */
      throw new Error('Unexpected undefined data');
    }
    if (transaction.invocationData === undefined) {
      throw new MissingTransactionDataError(transaction.hash);
    }

    const invocationData = this.convertInvocationData(
      transaction.invocationData,
      transaction.data.blockHash,
      transaction.data.blockIndex,
      transaction.hash,
      transaction.data.transactionIndex,
    );

    return {
      ...this.convertTransaction(transaction),
      invocationData,
      receipt: this.convertTransactionReceipt(transaction.data),
    };
  }

  private convertAttributes(attributes: readonly AttributeJSON[]): readonly Attribute[] {
    return attributes.map((attribute) => ({
      type: toAttributeType(attribute.type),
    }));
  }

  private convertContract(contract: ContractJSON): Contract {
    return {
      id: contract.id,
      script: contract.script,
      manifest: this.convertContractManifest(contract.manifest),
      hasStorage: contract.hasStorage,
      payable: contract.payable,
    };
  }

  private convertContractManifest(manifest: ContractManifestJSON): ContractManifest {
    return {
      hash: common.stringToUInt160(manifest.hash),
      hashHex: common.uInt160ToHex(common.stringToUInt160(manifest.hashHex)),
      groups: manifest.groups.map(this.convertContractGroup),
      features: {
        storage: manifest.features.storage,
        payable: manifest.features.payable,
      },
      supportedStandards: manifest.supportedStandards,
      abi: this.convertContractABI(manifest.abi),
      permissions: manifest.permissions.map(this.convertContractPermission),
      trusts: this.convertWildcardContainer(manifest.trusts, common.stringToUInt160),
      safeMethods: manifest.safeMethods,
      extra: manifest.extra,
      hasStorage: manifest.features.storage,
      payable: manifest.features.payable,
    };
  }

  private convertContractGroup(group: ContractGroupJSON): ContractGroup {
    return {
      publicKey: common.stringToECPoint(group.publicKey), // TODO: check this
      signature: group.signature,
    };
  }

  private convertContractPermission(permission: ContractPermissionJSON): ContractPermission {
    return {
      contract: this.convertContractPermissionDescriptor(permission.contract),
      methods: this.convertWildcardContainer(permission.methods, (str) => str),
    };
  }

  private convertWildcardContainer<TJSON, T>(
    container: WildcardContainerJSON<TJSON>,
    converter: (val: TJSON) => T,
  ): WildcardContainer<T> {
    if (container === '*') {
      return '*';
    }

    return container.map(converter);
  }

  private convertContractPermissionDescriptor(
    descriptor: ContractPermissionDescriptorJSON,
  ): ContractPermissionDescriptor {
    const hashOrGroup = descriptor.isWildcard
      ? '*'
      : descriptor.isGroup
      ? common.stringToECPoint(descriptor.hashOrGroup)
      : common.stringToUInt160(descriptor.hashOrGroup); // TODO: check

    return {
      hashOrGroup,
      isHash: descriptor.isHash,
      isGroup: descriptor.isGroup,
      isWildcard: descriptor.isWildcard,
    };
  }

  private convertContractABI(abi: ContractABIJSON): ContractABI {
    return {
      hash: common.stringToUInt160(abi.hash),
      methods: abi.methods.map(this.convertContractMethodDescriptor),
      events: abi.events.map(this.convertContractEventDescriptor),
    };
  }

  private convertContractEventDescriptor(event: ContractEventDescriptorJSON): ContractEventDescriptor {
    return {
      name: event.name,
      parameters: event.parameters.map(this.convertContractParameterDefinition),
    };
  }

  private convertContractMethodDescriptor(method: ContractMethodDescriptorJSON): ContractMethodDescriptor {
    return {
      name: method.name,
      parameters: method.parameters.map(this.convertContractParameterDefinition),
      returnType: this.convertContractParameterType(method.returnType),
      offset: method.offset,
    };
  }

  private convertContractParameterDefinition(param: ContractParameterDefinitionJSON): ContractParameterDefinition {
    return {
      type: this.convertContractParameterType(param.type),
      name: param.name,
    };
  }

  private convertContractParameterType(param: ContractParameterTypeJSON): ContractParameterType {
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

  private convertInvocationData(
    data: InvocationDataJSON,
    blockHash: string,
    blockIndex: number,
    transactionHash: string,
    transactionIndex: number,
  ): RawInvocationData {
    return {
      result: convertInvocationResult(data.result),
      contracts: data.contracts.map((contract) => this.convertContract(contract)),
      deletedContractAddresses: data.deletedContractHashes.map(scriptHashToAddress),
      migratedContractAddresses: data.migratedContractHashes.map<readonly [AddressString, AddressString]>(
        ([hash0, hash1]) => [scriptHashToAddress(hash0), scriptHashToAddress(hash1)],
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
