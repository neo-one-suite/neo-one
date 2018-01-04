/* @flow */
import type BN from 'bn.js';
import type {
  Account,
  AccountKey,
  AccountUpdate,
  Action,
  ActionKey,
  ActionsKey,
  Asset,
  AssetKey,
  AssetUpdate,
  Block,
  BlockKey,
  ConsensusPayload,
  DeserializeWireContext,
  SerializeJSONContext,
  Contract,
  ContractKey,
  ECPoint,
  FeeContext,
  Header,
  HeaderKey,
  Input,
  InvocationData,
  InvocationDataKey,
  InvocationResult,
  InvocationTransaction,
  StorageItem,
  StorageItemKey,
  StorageItemsKey,
  StorageItemUpdate,
  Output,
  OutputKey,
  Settings,
  Transaction,
  TransactionKey,
  Validator,
  ValidatorKey,
} from '@neo-one/client-core';
import { type Log } from '@neo-one/utils';
import type { Observable } from 'rxjs/Observable';

import type BlockSystemFee, { BlockSystemFeeKey } from './BlockSystemFee';
import type TransactionSpentCoins, {
  TransactionSpentCoinsKey,
  TransactionSpentCoinsUpdate,
} from './TransactionSpentCoins';

export interface ReadStorage<Key, Value> {
  +get: (key: Key) => Promise<Value>;
  +tryGet: (key: Key) => Promise<?Value>;
}
export interface ReadAllStorage<Key, Value> extends ReadStorage<Key, Value> {
  +all: Observable<Value>;
}
export interface ReadGetAllStorage<Key, PartialKey, Value>
  extends ReadStorage<Key, Value> {
  +getAll: (key: PartialKey) => Observable<Value>;
}

export interface AddStorage<Value> {
  +add: (add: Value) => Promise<void>;
}
export interface AddUpdateStorage<Value, Update> extends AddStorage<Value> {
  +update: (value: Value, update: Update) => Promise<Value>;
}
export interface DeleteStorage<Key> {
  +delete: (key: Key) => Promise<void>;
}
export interface AddUpdateDeleteStorage<Key, Value, Update>
  extends AddUpdateStorage<Value, Update>, DeleteStorage<Key> {}

interface ReadAddStorage<Key, Value>
  extends ReadStorage<Key, Value>, AddStorage<Value> {}
interface ReadAddDeleteStorage<Key, Value>
  extends ReadStorage<Key, Value>, AddStorage<Value>, DeleteStorage<Key> {}
interface ReadAddUpdateStorage<Key, Value, Update>
  extends ReadStorage<Key, Value>, AddUpdateStorage<Value, Update> {}
// eslint-disable-next-line
interface ReadAddUpdateDeleteStorage<Key, Value, Update>
  extends ReadStorage<Key, Value>, AddUpdateDeleteStorage<Key, Value, Update> {}
interface ReadAllAddStorage<Key, Value>
  extends ReadAllStorage<Key, Value>, AddStorage<Value> {}
interface ReadAllAddUpdateDeleteStorage<Key, Value, Update>
  extends ReadAllStorage<Key, Value>, AddUpdateDeleteStorage<
    Key,
    Value,
    Update,
  > {}
interface ReadGetAllAddStorage<Key, PartialKey, Value>
  extends ReadGetAllStorage<Key, PartialKey, Value>, AddStorage<Value> {}
interface ReadGetAllAddUpdateDeleteStorage<Key, PartialKey, Value, Update>
  extends ReadGetAllStorage<Key, PartialKey, Value>, AddUpdateDeleteStorage<
    Key,
    Value,
    Update,
  > {}

export type Blockchain = {
  +settings: Settings,
  +log: Log,
  +deserializeWireContext: DeserializeWireContext,
  +serializeJSONContext: SerializeJSONContext,
  +feeContext: FeeContext,

  +currentBlock: Block,
  +currentHeader: Header,
  +currentBlockIndex: number,
  +block$: Observable<Block>,

  +account: ReadAllStorage<AccountKey, Account>,
  +action: ReadGetAllStorage<ActionKey, ActionsKey, Action>,
  +asset: ReadStorage<AssetKey, Asset>,
  +block: ReadStorage<BlockKey, Block>,
  +blockSystemFee: ReadStorage<BlockSystemFeeKey, BlockSystemFee>,
  +header: ReadStorage<HeaderKey, Header>,
  +transaction: ReadStorage<TransactionKey, Transaction>,
  +transactionSpentCoins: ReadStorage<
    TransactionSpentCoinsKey,
    TransactionSpentCoins,
  >,
  +output: ReadStorage<OutputKey, Output>,
  +contract: ReadStorage<ContractKey, Contract>,
  +storageItem: ReadGetAllStorage<StorageItemKey, StorageItemsKey, StorageItem>,
  +validator: ReadAllStorage<ValidatorKey, Validator>,
  +invocationData: ReadStorage<InvocationDataKey, InvocationData>,

  +persistBlock: (options: {|
    block: Block,
    unsafe?: boolean,
  |}) => Promise<void>,
  +persistHeaders: (headers: Array<Header>) => Promise<void>,

  +verifyBlock: (block: Block) => Promise<void>,
  +verifyTransaction: ({
    transaction: Transaction,
    memPool?: Array<Transaction>,
  }) => Promise<void>,
  +verifyConsensusPayload: (payload: ConsensusPayload) => Promise<void>,

  +getValidators: (transactions: Array<Transaction>) => Promise<Array<ECPoint>>,

  +invokeScript: (script: Buffer) => Promise<InvocationResult>,
  +invokeTransaction: (
    transaction: InvocationTransaction,
  ) => Promise<InvocationResult>,
  +calculateClaimAmount: (inputs: Array<Input>) => Promise<BN>,

  +stop: () => Promise<void>,
};

export type WriteBlockchain = {
  +settings: $PropertyType<Blockchain, 'settings'>,
  +log: $PropertyType<Blockchain, 'log'>,

  +currentBlock: $PropertyType<Blockchain, 'currentBlock'>,
  +currentHeader: $PropertyType<Blockchain, 'currentHeader'>,
  +currentBlockIndex: number,
  +getValidators: $PropertyType<Blockchain, 'getValidators'>,

  +account: ReadAllAddUpdateDeleteStorage<AccountKey, Account, AccountUpdate>,
  +action: ReadGetAllAddStorage<ActionKey, ActionsKey, Action>,
  +asset: ReadAddUpdateStorage<AssetKey, Asset, AssetUpdate>,
  +block: ReadAddStorage<BlockKey, Block>,
  +blockSystemFee: ReadAddStorage<BlockSystemFeeKey, BlockSystemFee>,
  +header: ReadAddStorage<HeaderKey, Header>,
  +transaction: ReadAddStorage<TransactionKey, Transaction>,
  +transactionSpentCoins: ReadAddUpdateStorage<
    TransactionSpentCoinsKey,
    TransactionSpentCoins,
    TransactionSpentCoinsUpdate,
  >,
  +output: $PropertyType<Blockchain, 'output'>,
  +contract: ReadAddDeleteStorage<ContractKey, Contract>,
  +storageItem: ReadGetAllAddUpdateDeleteStorage<
    StorageItemKey,
    StorageItemsKey,
    StorageItem,
    StorageItemUpdate,
  >,
  +validator: ReadAllAddStorage<ValidatorKey, Validator>,
  +invocationData: ReadAddStorage<InvocationDataKey, InvocationData>,
};
