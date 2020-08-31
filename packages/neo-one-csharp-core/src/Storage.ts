import { Observable } from 'rxjs';
import { ContractIDState } from './ContractIDState';
import { ContractKey, ContractState } from './ContractState';
import { HashIndexState } from './HashIndexState';
import { HeaderHashList, HeaderKey } from './HeaderHashList';
import { StorageItem } from './StorageItem';
import { StorageKey } from './StorageKey';
import { TransactionKey, TransactionState } from './transaction';
import { BlockKey, TrimmedBlock } from './TrimmedBlock';

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

export interface ReadGetAllStorage<Key, PartialKey, Value> extends ReadStorage<Key, Value> {
  readonly getAll$: (key: PartialKey) => Observable<Value>;
}

export interface AddMetadataStorage<Value> {
  readonly add: (add: Value) => Promise<void>;
}

export interface AddStorage<Value> {
  readonly add: (add: Value) => Promise<void>;
}

export interface AddUpdateMetadataStorage<Value, Update> extends AddMetadataStorage<Value> {
  readonly update: (value: Value, update: Update) => Promise<Value>;
}

export interface AddUpdateStorage<Value, Update> extends AddStorage<Value> {
  readonly update: (value: Value, update: Update) => Promise<Value>;
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
export interface AddDeleteStorage<Key, Value> extends AddStorage<Value>, DeleteStorage<Key> {}
export interface AddUpdateDeleteStorage<Key, Value, Update>
  extends AddUpdateStorage<Value, Update>,
    DeleteStorage<Key> {}

/* this block of types were previously used in our storage; keeping them around until we know if we'll need them again */
interface ReadAddStorage<Key, Value> extends ReadStorage<Key, Value>, AddStorage<Value> {}
interface ReadAddDeleteStorage<Key, Value> extends ReadStorage<Key, Value>, AddStorage<Value>, DeleteStorage<Key> {}
interface ReadAddUpdateMetadataStorage<Value, Update>
  extends ReadMetadataStorage<Value>,
    AddUpdateMetadataStorage<Value, Update> {}
interface ReadAddUpdateStorage<Key, Value, Update> extends ReadStorage<Key, Value>, AddUpdateStorage<Value, Update> {}
interface ReadGetAllAddDeleteStorage<Key, PartialKey, Value>
  extends ReadGetAllStorage<Key, PartialKey, Value>,
    AddDeleteStorage<Key, Value> {}
interface ReadAllAddStorage<Key, Value> extends ReadAllStorage<Key, Value>, AddStorage<Value> {}
interface ReadAllAddUpdateDeleteStorage<Key, Value, Update>
  extends ReadAllStorage<Key, Value>,
    AddUpdateDeleteStorage<Key, Value, Update> {}

interface ReadGetAllAddStorage<Key, PartialKey, Value>
  extends ReadGetAllStorage<Key, PartialKey, Value>,
    AddStorage<Value> {}
interface ReadGetAllAddUpdateDeleteStorage<Key, PartialKey, Value, Update>
  extends ReadGetAllStorage<Key, PartialKey, Value>,
    AddUpdateDeleteStorage<Key, Value, Update> {}

export type AddChange =
  | { readonly type: 'block'; readonly value: TrimmedBlock }
  | { readonly type: 'transaction'; readonly value: TransactionState }
  | { readonly type: 'contract'; readonly value: ContractState }
  | { readonly type: 'storage'; readonly value: StorageItem }
  | { readonly type: 'headerHashList'; readonly value: HeaderHashList }
  | { readonly type: 'blockHashIndex'; readonly value: HashIndexState }
  | { readonly type: 'headerHashIndex'; readonly value: HashIndexState }
  | { readonly type: 'contractID'; readonly value: ContractIDState };

export type DeleteChange =
  | { readonly type: 'contract'; readonly value: ContractKey }
  | { readonly type: 'storage'; readonly value: StorageKey };

export type Change =
  | { readonly type: 'add'; readonly change: AddChange; readonly subType: 'add' | 'update' }
  | { readonly type: 'delete'; readonly change: DeleteChange };

export type ChangeSet = readonly Change[];

interface LatestReadStorage<Key, Value> extends ReadStorage<Key, Value> {
  readonly tryGetLatest: () => Promise<Value | undefined>;
}

export interface BlockchainStorage {
  readonly blocks: ReadStorage<BlockKey, TrimmedBlock>;
  readonly transactions: ReadStorage<TransactionKey, TransactionState>;
  readonly contracts: ReadStorage<ContractKey, ContractState>;
  readonly storages: ReadGetAllStorage<StorageKey, Partial<StorageKey>, StorageItem>;
  readonly headerHashList: ReadStorage<HeaderKey, HeaderHashList>;
  readonly blockHashIndex: ReadMetadataStorage<HashIndexState>;
  readonly headerHashIndex: ReadMetadataStorage<HashIndexState>;
  readonly contractID: ReadMetadataStorage<ContractIDState>;
}

export interface Storage extends BlockchainStorage {
  readonly block: LatestReadStorage<BlockKey, TrimmedBlock>;
  readonly headerHashList: LatestReadStorage<HeaderKey, HeaderHashList>;
  readonly commit: (changeSet: ChangeSet) => Promise<void>;
  readonly close: () => Promise<void>;
  readonly reset: () => Promise<void>;
}
