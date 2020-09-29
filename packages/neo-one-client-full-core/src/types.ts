import {
  AddressString,
  Block,
  BufferString,
  Contract,
  ContractManifestClient,
  GetOptions,
  Hash256String,
  InvocationResult,
  IterOptions,
  NetworkType,
  Param,
  Peer,
  SourceMaps,
  Transaction,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UserAccountProvider as UserAccountProviderLite,
} from '@neo-one/client-common';

export interface ContractRegister {
  readonly script: BufferString;
  readonly manifest: ContractManifestClient;
  readonly id: number;
}

export interface PublishReceipt extends TransactionReceipt {
  readonly result: InvocationResult<Contract>;
}

export interface UserAccountProvider extends UserAccountProviderLite {
  readonly publish: (
    contract: ContractRegister,
    options?: TransactionOptions,
  ) => Promise<TransactionResult<PublishReceipt>>;
  readonly publishAndDeploy: (
    contract: ContractRegister,
    manifest: ContractManifestClient,
    params: readonly Param[],
    options?: TransactionOptions,
    sourceMaps?: SourceMaps,
  ) => Promise<TransactionResult<PublishReceipt>>;
  readonly read: (network: NetworkType) => DataProvider;
}

export interface UserAccountProviders {
  readonly [type: string]: UserAccountProvider;
}

export interface DataProvider {
  readonly network: NetworkType;
  readonly getAccount: (address: AddressString) => Promise<Account>;
  readonly getBlock: (hashOrIndex: number | Hash256String, options?: GetOptions) => Promise<Block>;
  readonly iterBlocks: (options?: IterOptions) => AsyncIterable<Block>;
  readonly getBestBlockHash: () => Promise<Hash256String>;
  readonly getBlockCount: () => Promise<number>;
  readonly getContract: (address: AddressString) => Promise<Contract>;
  readonly getMemPool: () => Promise<readonly Hash256String[]>;
  readonly getTransaction: (hash: Hash256String) => Promise<Transaction>;
  readonly getConnectedPeers: () => Promise<readonly Peer[]>;
}

export interface InvokeExecuteTransactionOptions extends TransactionOptions {
  readonly transfers?: readonly Transfer[];
}
