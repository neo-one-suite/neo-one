import { ECPoint, UInt160, UInt256, VerifyResultModel } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Observable } from 'rxjs';
import { Block } from './Block';
import { Header } from './Header';
import { HeaderCache } from './HeaderCache';
import { ImmutableHashSet } from './ImmutableHashSet';
import { ExtensiblePayload } from './payload';
import { DeserializeWireContext, SerializeJSONContext } from './Serializable';
import { BlockchainSettings, VMProtocolSettingsIn } from './Settings';
import { Signers } from './Signers';
import { BlockchainStorage, Storage } from './Storage';
import { Transaction, TransactionState } from './transaction';
import { TransactionVerificationContext } from './TransactionVerificationContext';
import { TrimmedBlock } from './TrimmedBlock';
import { VerifyOptions, VerifyWitnesses } from './Verifiable';
import { CallReceipt } from './vm';

export interface Mempool {
  readonly [k: string]: Transaction | undefined;
}

export interface Blockchain extends BlockchainStorage {
  readonly settings: BlockchainSettings;
  readonly protocolSettings: VMProtocolSettingsIn;
  readonly deserializeWireContext: DeserializeWireContext;
  readonly serializeJSONContext: SerializeJSONContext;

  readonly currentBlock: Block;
  readonly previousBlock: Block | undefined;
  readonly currentBlockIndex: number;
  readonly block$: Observable<Block>;
  readonly isPersistingBlock: boolean;
  readonly verifyOptions: VerifyOptions;
  readonly onPersistNativeContractScript: Buffer;
  readonly headerCache: HeaderCache;

  readonly persistBlock: (options: { readonly block: Block; readonly verify?: boolean }) => Promise<void>;

  readonly verifyWitnesses: VerifyWitnesses;
  readonly verifyBlock: (block: Block) => Promise<void>;
  readonly verifyTransaction: (
    transaction: Transaction,
    mempool: Mempool,
    context?: TransactionVerificationContext,
  ) => Promise<VerifyResultModel>;
  readonly verifyConsensusPayload: (payload: ExtensiblePayload) => Promise<void>;

  readonly getBlock: (hashOrIndex: UInt256 | number) => Promise<Block | undefined>;
  readonly getHeader: (hashOrIndex: UInt256 | number) => Promise<Header | undefined>;
  readonly getBlockHash: (index: number) => Promise<UInt256 | undefined>;
  readonly getNextBlockHash: (hash: UInt256) => Promise<UInt256 | undefined>;
  readonly getTransaction: (hash: UInt256) => Promise<TransactionState | undefined>;
  readonly getCurrentIndex: () => Promise<number>;
  readonly getCurrentHash: () => Promise<UInt256>;
  readonly getCurrentBlock: () => Promise<Block | undefined>;
  readonly getTrimmedBlock: (hash: UInt256) => Promise<TrimmedBlock | undefined>;
  readonly containsTransaction: (hash: UInt256) => Promise<boolean>;

  readonly getValidators: () => Promise<readonly ECPoint[]>;
  readonly getNextBlockValidators: () => Promise<readonly ECPoint[]>;
  readonly getFeePerByte: () => Promise<BN>;
  readonly shouldRefreshCommittee: (offset?: number) => boolean;
  readonly updateExtensibleWitnessWhiteList: (storage: Storage) => Promise<ImmutableHashSet<UInt160>>;

  readonly invokeScript: (options: {
    readonly script: Buffer;
    readonly signers?: Signers;
    readonly gas?: BN;
    readonly rvcount?: number;
  }) => CallReceipt;
  readonly testTransaction: (transaction: Transaction) => CallReceipt;
  readonly getVerificationCost: (
    contractHash: UInt160,
    transaction: Transaction,
  ) => Promise<{
    readonly fee: BN;
    readonly size: number;
  }>;

  // readonly updateSettings: (settings: BlockchainSettings) => void;
  readonly stop: () => Promise<void>;
  readonly reset: () => Promise<void>;
}
