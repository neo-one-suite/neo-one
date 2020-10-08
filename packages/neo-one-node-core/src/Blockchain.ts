import { UInt256, VerifyResultModel } from '@neo-one/client-common';
import { Observable } from 'rxjs';
import { Block } from './Block';
import { Header } from './Header';
import { ConsensusPayload } from './payload';
import { DeserializeWireContext, SerializeJSONContext } from './Serializable';
import { BlockchainSettings } from './Settings';
import { Signers } from './Signers';
import { BlockchainStorage } from './Storage';
import { Transaction } from './transaction';
import { TransactionVerificationContext } from './TransactionVerificationContext';
import { VerifyOptions, VerifyWitnesses } from './Verifiable';
import { CallReceipt } from './vm';

export interface Mempool {
  readonly [k: string]: Transaction | undefined;
}

export interface Blockchain extends BlockchainStorage {
  readonly settings: BlockchainSettings;
  readonly deserializeWireContext: DeserializeWireContext;
  readonly serializeJSONContext: SerializeJSONContext;

  readonly currentBlock: Block;
  readonly previousBlock: Block | undefined;
  readonly currentHeaderIndex: number;
  readonly currentBlockIndex: number;
  readonly block$: Observable<Block>;
  readonly isPersistingBlock: boolean;
  readonly verifyOptions: VerifyOptions;
  readonly onPersistNativeContractScript: Buffer;

  readonly persistBlock: (options: { readonly block: Block; readonly verify?: boolean }) => Promise<void>;

  readonly verifyWitnesses: VerifyWitnesses;
  readonly verifyBlock: (block: Block) => Promise<void>;
  readonly verifyTransaction: (
    transaction: Transaction,
    mempool: Mempool,
    context?: TransactionVerificationContext,
  ) => Promise<VerifyResultModel>;
  readonly verifyConsensusPayload: (payload: ConsensusPayload) => Promise<void>;

  readonly getBlock: (hashOrIndex: UInt256 | number) => Promise<Block | undefined>;
  readonly getHeader: (hashOrIndex: UInt256 | number) => Promise<Header | undefined>;
  readonly getBlockHash: (index: number) => UInt256 | undefined;
  readonly getNextBlockHash: (hash: UInt256) => Promise<UInt256 | undefined>;

  readonly invokeScript: (script: Buffer, signers?: Signers) => CallReceipt;

  // readonly updateSettings: (settings: BlockchainSettings) => void;
  readonly stop: () => Promise<void>;
  readonly reset: () => Promise<void>;
}
