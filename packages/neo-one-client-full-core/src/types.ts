import {
  ABI,
  Account,
  AddressString,
  Asset,
  AssetType,
  Block,
  BufferString,
  Contract,
  ContractParameterType,
  GetOptions,
  Hash256String,
  Input,
  InvocationResult,
  InvocationTransaction,
  IssueTransaction,
  IterOptions,
  NetworkType,
  Output,
  Param,
  Peer,
  PublicKeyString,
  SourceMaps,
  Transaction,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UserAccountProvider as UserAccountProviderLite,
} from '@neo-one/client-common';
import { Monitor } from '@neo-one/monitor';
import BigNumber from 'bignumber.js';

export interface AssetRegister {
  readonly type: AssetType;
  readonly name: string;
  readonly amount: BigNumber;
  readonly precision: number;
  readonly owner: PublicKeyString;
  readonly admin: AddressString;
  readonly issuer: AddressString;
}

export interface ContractRegister {
  readonly script: BufferString;
  readonly parameters: readonly ContractParameterType[];
  readonly returnType: ContractParameterType;
  readonly name: string;
  readonly codeVersion: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
  readonly storage: boolean;
  readonly dynamicInvoke: boolean;
  readonly payable: boolean;
}

export interface PublishReceipt extends TransactionReceipt {
  readonly result: InvocationResult<Contract>;
}

export interface RegisterAssetReceipt extends TransactionReceipt {
  readonly result: InvocationResult<Asset>;
}

export interface UserAccountProvider extends UserAccountProviderLite {
  readonly publish: (
    contract: ContractRegister,
    options?: TransactionOptions,
  ) => Promise<TransactionResult<PublishReceipt, InvocationTransaction>>;
  readonly publishAndDeploy: (
    contract: ContractRegister,
    abi: ABI,
    params: readonly Param[],
    options?: TransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<PublishReceipt, InvocationTransaction>>;
  readonly registerAsset: (
    asset: AssetRegister,
    options?: TransactionOptions,
  ) => Promise<TransactionResult<RegisterAssetReceipt, InvocationTransaction>>;
  readonly issue: (
    transfers: readonly Transfer[],
    options?: TransactionOptions,
  ) => Promise<TransactionResult<TransactionReceipt, IssueTransaction>>;
  readonly read: (network: NetworkType) => DataProvider;
}

export interface UserAccountProviders {
  readonly [type: string]: UserAccountProvider;
}

export interface DataProvider {
  readonly network: NetworkType;
  readonly getAccount: (address: AddressString, monitor?: Monitor) => Promise<Account>;
  readonly getAsset: (hash: Hash256String, monitor?: Monitor) => Promise<Asset>;
  readonly getBlock: (hashOrIndex: number | Hash256String, options?: GetOptions) => Promise<Block>;
  readonly iterBlocks: (options?: IterOptions) => AsyncIterable<Block>;
  readonly getBestBlockHash: (monitor?: Monitor) => Promise<Hash256String>;
  readonly getBlockCount: (monitor?: Monitor) => Promise<number>;
  readonly getContract: (address: AddressString, monitor?: Monitor) => Promise<Contract>;
  readonly getMemPool: (monitor?: Monitor) => Promise<readonly Hash256String[]>;
  readonly getTransaction: (hash: Hash256String, monitor?: Monitor) => Promise<Transaction>;
  readonly getOutput: (input: Input, monitor?: Monitor) => Promise<Output>;
  readonly getConnectedPeers: (monitor?: Monitor) => Promise<readonly Peer[]>;
}

export interface InvokeExecuteTransactionOptions extends TransactionOptions {
  readonly transfers?: readonly Transfer[];
}
