import {
  Account,
  AccountKey,
  Action,
  Asset,
  Block,
  BlockKey,
  Contract,
  ContractKey,
  Header,
  HeaderKey,
  InvocationData,
  Output,
  StorageItem,
  StorageItemKey,
  Transaction,
  TransactionData,
  UInt256,
  Validator,
  ValidatorKey,
} from '@neo-one/client-core';
import { AccountUnclaimed, AccountUnclaimedKey } from './AccountUnclaimed';
import { AccountUnspent, AccountUnspentKey } from './AccountUnspent';
import { Blockchain, ReadStorage } from './Blockchain';
import { BlockData } from './BlockData';
import { ValidatorsCount } from './ValidatorsCount';

interface OutputValue {
  readonly hash: UInt256;
  readonly index: number;
  readonly output: Output;
}

export type AddChange =
  | { readonly type: 'account'; readonly value: Account }
  | { readonly type: 'accountUnclaimed'; readonly value: AccountUnclaimed }
  | { readonly type: 'accountUnspent'; readonly value: AccountUnspent }
  | { readonly type: 'action'; readonly value: Action }
  | { readonly type: 'asset'; readonly value: Asset }
  | { readonly type: 'block'; readonly value: Block }
  | { readonly type: 'header'; readonly value: Header }
  | { readonly type: 'transaction'; readonly value: Transaction }
  | { readonly type: 'contract'; readonly value: Contract }
  | { readonly type: 'storageItem'; readonly value: StorageItem }
  | { readonly type: 'validator'; readonly value: Validator }
  | { readonly type: 'blockData'; readonly value: BlockData }
  | { readonly type: 'transactionData'; readonly value: TransactionData }
  | { readonly type: 'invocationData'; readonly value: InvocationData }
  | { readonly type: 'output'; readonly value: OutputValue }
  | { readonly type: 'validatorsCount'; readonly value: ValidatorsCount };
export type DeleteChange =
  | { readonly type: 'account'; readonly key: AccountKey }
  | { readonly type: 'accountUnclaimed'; readonly key: AccountUnclaimedKey }
  | { readonly type: 'accountUnspent'; readonly key: AccountUnspentKey }
  | { readonly type: 'contract'; readonly key: ContractKey }
  | { readonly type: 'storageItem'; readonly key: StorageItemKey }
  | { readonly type: 'validator'; readonly key: ValidatorKey };
export type Change =
  | { readonly type: 'add'; readonly change: AddChange }
  | { readonly type: 'delete'; readonly change: DeleteChange };
export type ChangeSet = ReadonlyArray<Change>;

interface LatestReadStorage<Key, Value> extends ReadStorage<Key, Value> {
  readonly tryGetLatest: () => Promise<Value | null>;
}

export interface Storage {
  readonly account: Blockchain['account'];
  readonly accountUnclaimed: Blockchain['accountUnclaimed'];
  readonly accountUnspent: Blockchain['accountUnspent'];
  readonly action: Blockchain['action'];
  readonly asset: Blockchain['asset'];
  readonly block: LatestReadStorage<BlockKey, Block>;
  readonly blockData: Blockchain['blockData'];
  readonly header: LatestReadStorage<HeaderKey, Header>;
  readonly transaction: Blockchain['transaction'];
  readonly transactionData: Blockchain['transactionData'];
  readonly output: Blockchain['output'];
  readonly contract: Blockchain['contract'];
  readonly storageItem: Blockchain['storageItem'];
  readonly validator: Blockchain['validator'];
  readonly invocationData: Blockchain['invocationData'];
  readonly validatorsCount: Blockchain['validatorsCount'];
  readonly commit: (changeSet: ChangeSet) => Promise<void>;
  readonly close: () => Promise<void>;
  readonly reset: () => Promise<void>;
}
