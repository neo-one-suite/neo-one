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
import type { Monitor } from '@neo-one/monitor';
import type { Observable } from 'rxjs/Observable';

import type AccountUnclaimed, {
  AccountUnclaimedKey,
  AccountUnclaimedsKey,
} from './AccountUnclaimed';
import type AccountUnspent, {
  AccountUnspentKey,
  AccountUnspentsKey,
} from './AccountUnspent';
import type BlockSystemFee, { BlockSystemFeeKey } from './BlockSystemFee';
import type TransactionSpentCoins, {
  TransactionSpentCoinsKey,
  TransactionSpentCoinsUpdate,
} from './TransactionSpentCoins';
import type ValidatorsCount, { ValidatorsCountUpdate } from './ValidatorsCount';

export interface ReadMetadataStorage<Value> {
  +get: () => Promise<Value>;
  +tryGet: () => Promise<?Value>;
}
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

export interface AddMetadataStorage<Value> {
  +add: (add: Value) => Promise<void>;
}
export interface AddStorage<Value> {
  +add: (add: Value) => Promise<void>;
}
export interface AddUpdateMetadataStorage<Value, Update>
  extends AddMetadataStorage<Value> {
  +update: (value: Value, update: Update) => Promise<Value>;
}
export interface AddUpdateStorage<Value, Update> extends AddStorage<Value> {
  +update: (value: Value, update: Update) => Promise<Value>;
}
export interface DeleteMetadataStorage {
  +delete: () => Promise<void>;
}
export interface DeleteStorage<Key> {
  +delete: (key: Key) => Promise<void>;
}
export interface AddUpdateDeleteMetadataStorage<Value, Update>
  extends AddUpdateMetadataStorage<Value, Update>, DeleteMetadataStorage {}
export interface AddUpdateDeleteStorage<Key, Value, Update>
  extends AddUpdateStorage<Value, Update>, DeleteStorage<Key> {}

interface ReadAddStorage<Key, Value>
  extends ReadStorage<Key, Value>, AddStorage<Value> {}
interface ReadAddDeleteStorage<Key, Value>
  extends ReadStorage<Key, Value>, AddStorage<Value>, DeleteStorage<Key> {}
interface ReadAddUpdateMetadataStorage<Value, Update>
  extends ReadMetadataStorage<Value>, AddUpdateMetadataStorage<Value, Update> {}
interface ReadAddUpdateStorage<Key, Value, Update>
  extends ReadStorage<Key, Value>, AddUpdateStorage<Value, Update> {}
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
  +deserializeWireContext: DeserializeWireContext,
  +serializeJSONContext: SerializeJSONContext,
  +feeContext: FeeContext,

  +currentBlock: Block,
  +currentHeader: Header,
  +currentBlockIndex: number,
  +block$: Observable<Block>,
  +isPersistingBlock: boolean,

  +account: ReadAllStorage<AccountKey, Account>,
  +accountUnclaimed: ReadGetAllStorage<
    AccountUnclaimedKey,
    AccountUnclaimedsKey,
    AccountUnclaimed,
  >,
  +accountUnspent: ReadGetAllStorage<
    AccountUnspentKey,
    AccountUnspentsKey,
    AccountUnspent,
  >,
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
  +validatorsCount: ReadMetadataStorage<ValidatorsCount>,

  +persistBlock: (options: {|
    monitor?: Monitor,
    block: Block,
    unsafe?: boolean,
  |}) => Promise<void>,
  +persistHeaders: (headers: Array<Header>, monitor?: Monitor) => Promise<void>,

  +verifyBlock: (block: Block, monitor?: Monitor) => Promise<void>,
  +verifyTransaction: ({
    monitor?: Monitor,
    transaction: Transaction,
    memPool?: Array<Transaction>,
  }) => Promise<void>,
  +verifyConsensusPayload: (
    payload: ConsensusPayload,
    monitor?: Monitor,
  ) => Promise<void>,

  +getValidators: (
    transactions: Array<Transaction>,
    monitor?: Monitor,
  ) => Promise<Array<ECPoint>>,

  +invokeScript: (
    script: Buffer,
    monitor?: Monitor,
  ) => Promise<InvocationResult>,
  +invokeTransaction: (
    transaction: InvocationTransaction,
    monitor?: Monitor,
  ) => Promise<InvocationResult>,
  +calculateClaimAmount: (
    inputs: Array<Input>,
    monitor?: Monitor,
  ) => Promise<BN>,

  +updateSettings: (settings: Settings) => void,
  +stop: () => Promise<void>,
};

export type WriteBlockchain = {
  +settings: $PropertyType<Blockchain, 'settings'>,

  +currentBlock: $PropertyType<Blockchain, 'currentBlock'>,
  +currentHeader: $PropertyType<Blockchain, 'currentHeader'>,
  +currentBlockIndex: number,
  +getValidators: $PropertyType<Blockchain, 'getValidators'>,

  +account: ReadAllAddUpdateDeleteStorage<AccountKey, Account, AccountUpdate>,
  +accountUnclaimed: ReadAddDeleteStorage<
    AccountUnclaimedKey,
    AccountUnclaimed,
  >,
  +accountUnspent: ReadAddDeleteStorage<AccountUnspentKey, AccountUnspent>,
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
  +validatorsCount: ReadAddUpdateMetadataStorage<
    ValidatorsCount,
    ValidatorsCountUpdate,
  >,
};
