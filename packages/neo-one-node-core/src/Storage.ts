import { ApplicationLogJSON } from '@neo-one/client-common';
import { Observable } from 'rxjs';
import { ApplicationLog } from './ApplicationLog';
import { ContractIDState } from './ContractIDState';
import { ContractKey, ContractState } from './ContractState';
import { HashIndexState } from './HashIndexState';
import { HeaderHashList, HeaderKey } from './HeaderHashList';
import { Nep17Balance } from './Nep17Balance';
import { Nep17BalanceKey } from './Nep17BalanceKey';
import { Nep17Transfer } from './Nep17Transfer';
import { Nep17TransferKey } from './Nep17TransferKey';
import { StorageItem } from './StorageItem';
import { StorageKey } from './StorageKey';
import { TransactionKey, TransactionState } from './transaction';
import { BlockKey, TrimmedBlock } from './TrimmedBlock';

// TODO: along with other storage definitions in node-vm `batch` definitions need to move to `node-core`.
type AbstractBatch = any;

export interface StreamOptions {
  readonly gte?: Buffer;
  readonly lte?: Buffer;
}

export interface StorageReturn<Key, Value> {
  readonly key: Key;
  readonly value: Value;
}

export interface ReadMetadataStorage<Value> {
  readonly get: () => Promise<Value>;
  readonly tryGet: () => Promise<Value | undefined>;
}

export interface ReadStorage<Key, Value> {
  readonly get: (key: Key) => Promise<Value>;
  readonly tryGet: (key: Key) => Promise<Value | undefined>;
}

export interface ReadAllStorage<Key, Value> extends ReadStorage<Key, Value> {
  readonly all$: Observable<Value>;
}

export interface ReadFindStorage<Key, Value> extends ReadStorage<Key, Value> {
  readonly find$: (lookup: Buffer, secondaryLookup?: Buffer) => Observable<StorageReturn<Key, Value>>;
}

export interface ReadAllFindStorage<Key, Value> extends ReadAllStorage<Key, Value>, ReadFindStorage<Key, Value> {}

export interface AddMetadataStorage<Value> {
  readonly add: (add: Value) => Promise<void>;
}

export interface AddStorage<Key, Value> {
  readonly add: (key: Key, value: Value) => Promise<void>;
}

export interface AddUpdateMetadataStorage<Value, Update> extends AddMetadataStorage<Value> {
  readonly update: (value: Value, update: Update) => Promise<Value>;
}

export interface AddUpdateStorage<Key, Value, Update> extends AddStorage<Key, Value> {
  readonly update: (key: Key, update: Update) => Promise<Update>;
}

export interface DeleteMetadataStorage {
  readonly delete: () => Promise<void>;
}

export interface DeleteStorage<Key> {
  readonly delete: (key: Key) => Promise<void>;
}

export interface AddUpdateDeleteMetadataStorage<Value, Update>
  extends AddUpdateMetadataStorage<Value, Update>,
    DeleteMetadataStorage {}
export interface AddDeleteStorage<Key, Value> extends AddStorage<Key, Value>, DeleteStorage<Key> {}
export interface AddUpdateDeleteStorage<Key, Value, Update>
  extends AddUpdateStorage<Key, Value, Update>,
    DeleteStorage<Key> {}

/* this block of types were previously used in our storage; keeping them around until we know if we'll need them again */
interface ReadAddStorage<Key, Value> extends ReadStorage<Key, Value>, AddStorage<Key, Value> {}
interface ReadAddDeleteStorage<Key, Value>
  extends ReadStorage<Key, Value>,
    AddStorage<Key, Value>,
    DeleteStorage<Key> {}
interface ReadAddUpdateMetadataStorage<Value, Update>
  extends ReadMetadataStorage<Value>,
    AddUpdateMetadataStorage<Value, Update> {}
interface ReadAddUpdateStorage<Key, Value, Update>
  extends ReadStorage<Key, Value>,
    AddUpdateStorage<Key, Value, Update> {}
interface ReadAllAddStorage<Key, Value> extends ReadAllStorage<Key, Value>, AddStorage<Key, Value> {}
interface ReadAllAddUpdateDeleteStorage<Key, Value, Update>
  extends ReadAllStorage<Key, Value>,
    AddUpdateDeleteStorage<Key, Value, Update> {}

export interface LatestReadStorage<Key, Value> extends ReadStorage<Key, Value> {
  readonly tryGetLatest: () => Promise<Value | undefined>;
}

export type AddChange =
  | { readonly type: 'block'; readonly key: BlockKey; readonly value: TrimmedBlock }
  | { readonly type: 'transaction'; readonly key: TransactionKey; readonly value: TransactionState }
  // | { readonly type: 'contract'; readonly key: ContractKey; readonly value: ContractState }
  | { readonly type: 'storage'; readonly key: StorageKey; readonly value: StorageItem }
  | { readonly type: 'headerHashList'; readonly key: HeaderKey; readonly value: HeaderHashList }
  | { readonly type: 'blockHashIndex'; readonly value: HashIndexState }
  | { readonly type: 'headerHashIndex'; readonly value: HashIndexState }
  // | { readonly type: 'contractID'; readonly value: ContractIDState }
  | { readonly type: 'nep17Balance'; readonly key: Nep17BalanceKey; readonly value: Nep17Balance }
  | { readonly type: 'nep17TransferSent'; readonly key: Nep17TransferKey; readonly value: Nep17Transfer }
  | { readonly type: 'nep17TransferReceived'; readonly key: Nep17TransferKey; readonly value: Nep17Transfer }
  | { readonly type: 'applicationLog'; readonly key: TransactionKey; readonly value: ApplicationLog };

export type DeleteChange =
  // | { readonly type: 'contract'; readonly key: ContractKey }
  | { readonly type: 'storage'; readonly key: StorageKey }
  | { readonly type: 'nep17Balance'; readonly key: Nep17BalanceKey };

export type Change =
  | { readonly type: 'add'; readonly change: AddChange; readonly subType: 'add' | 'update' }
  | { readonly type: 'delete'; readonly change: DeleteChange };

export type ChangeSet = readonly Change[];

export interface BlockchainStorage {
  readonly blocks: ReadStorage<BlockKey, TrimmedBlock>;
  readonly nep17Balances: ReadAllFindStorage<Nep17BalanceKey, Nep17Balance>;
  readonly nep17TransfersSent: ReadFindStorage<Nep17TransferKey, Nep17Transfer>;
  readonly nep17TransfersReceived: ReadFindStorage<Nep17TransferKey, Nep17Transfer>;
  readonly applicationLogs: ReadStorage<TransactionKey, ApplicationLogJSON>;
  // readonly consensusState: ReadMetadataStorage<ConsensusContext>;
  readonly transactions: ReadStorage<TransactionKey, TransactionState>;
  readonly storages: ReadFindStorage<StorageKey, StorageItem>;
  readonly headerHashList: ReadStorage<HeaderKey, HeaderHashList>;
  readonly blockHashIndex: ReadMetadataStorage<HashIndexState>;
  readonly headerHashIndex: ReadMetadataStorage<HashIndexState>;
}

export interface Storage extends BlockchainStorage {
  readonly blocks: ReadAllStorage<BlockKey, TrimmedBlock>;
  readonly commit: (changeSet: ChangeSet) => Promise<void>;
  // tslint:disable-next-line: readonly-array
  readonly commitBatch: (batch: AbstractBatch[]) => Promise<void>;
  readonly close: () => Promise<void>;
  readonly reset: () => Promise<void>;
}
