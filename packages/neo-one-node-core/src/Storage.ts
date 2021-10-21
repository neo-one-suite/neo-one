import { ApplicationLogJSON } from '@neo-one/client-common';
import { Observable } from 'rxjs';
import { Action, ActionKey } from './action';
import { ApplicationLog } from './ApplicationLog';
import { BlockData, BlockDataKey } from './BlockData';
import { Nep17Balance } from './Nep17Balance';
import { Nep17BalanceKey } from './Nep17BalanceKey';
import { Nep17Transfer } from './Nep17Transfer';
import { Nep17TransferKey } from './Nep17TransferKey';
import { StorageItem } from './StorageItem';
import { StorageKey } from './StorageKey';
import { FailedTransaction, FailedTransactionKey, TransactionKey } from './transaction';
import { TransactionData, TransactionDataKey } from './TransactionData';

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
export interface LatestReadStorage<Key, Value> extends ReadStorage<Key, Value> {
  readonly tryGetLatest: () => Promise<Value | undefined>;
}

export type AddChange =
  | { readonly type: 'storage'; readonly key: StorageKey; readonly value: StorageItem }
  | { readonly type: 'nep17Balance'; readonly key: Nep17BalanceKey; readonly value: Nep17Balance }
  | { readonly type: 'nep17TransferSent'; readonly key: Nep17TransferKey; readonly value: Nep17Transfer }
  | { readonly type: 'nep17TransferReceived'; readonly key: Nep17TransferKey; readonly value: Nep17Transfer }
  | { readonly type: 'applicationLog'; readonly key: TransactionKey; readonly value: ApplicationLog }
  | { readonly type: 'blockData'; readonly key: BlockDataKey; readonly value: BlockData }
  | { readonly type: 'transactionData'; readonly key: TransactionDataKey; readonly value: TransactionData }
  | { readonly type: 'action'; readonly key: ActionKey; readonly value: Action }
  | { readonly type: 'failedTransaction'; readonly key: FailedTransactionKey; readonly value: FailedTransaction };

export type DeleteChange =
  | { readonly type: 'storage'; readonly key: StorageKey }
  | { readonly type: 'nep17Balance'; readonly key: Nep17BalanceKey };

export type Change =
  | { readonly type: 'add'; readonly change: AddChange; readonly subType: 'add' | 'update' }
  | { readonly type: 'delete'; readonly change: DeleteChange };

export type ChangeSet = readonly Change[];

export interface BlockchainStorage {
  readonly nep17Balances: ReadAllFindStorage<Nep17BalanceKey, Nep17Balance>;
  readonly nep17TransfersSent: ReadFindStorage<Nep17TransferKey, Nep17Transfer>;
  readonly nep17TransfersReceived: ReadFindStorage<Nep17TransferKey, Nep17Transfer>;
  readonly applicationLogs: ReadStorage<TransactionKey, ApplicationLogJSON>;
  readonly storages: ReadFindStorage<StorageKey, StorageItem>;
  readonly blockData: ReadStorage<BlockDataKey, BlockData>;
  readonly transactionData: ReadStorage<TransactionDataKey, TransactionData>;
  readonly action: ReadAllFindStorage<ActionKey, Action>;
  readonly failedTransactions: ReadAllFindStorage<FailedTransactionKey, FailedTransaction>;
}

interface PutBatch {
  readonly type: 'put';
  readonly key: Buffer;
  readonly value: Buffer;
}

interface DeleteBatch {
  readonly type: 'del';
  readonly key: Buffer;
}

export type Batch = PutBatch | DeleteBatch;

export interface Storage extends BlockchainStorage {
  readonly commit: (changeSet: ChangeSet) => Promise<void>;
  // tslint:disable-next-line: readonly-array
  readonly commitBatch: (batch: Batch[]) => Promise<void>;
  readonly close: () => Promise<void>;
  readonly reset: () => Promise<void>;
}
