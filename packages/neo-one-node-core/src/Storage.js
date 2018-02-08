/* @flow */
import type {
  Account,
  AccountKey,
  Asset,
  Action,
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
  UInt256,
  Validator,
  ValidatorKey,
} from '@neo-one/client-core';

import type AccountUnclaimed, { AccountUnclaimedKey } from './AccountUnclaimed';
import type AccountUnspent, { AccountUnspentKey } from './AccountUnspent';
import type BlockSystemFee from './BlockSystemFee';
import type { Blockchain, ReadStorage } from './Blockchain';
import type TransactionSpentCoins from './TransactionSpentCoins';
import type ValidatorsCount from './ValidatorsCount';

type OutputValue = {|
  hash: UInt256,
  index: number,
  output: Output,
|};
export type AddChange =
  | {| type: 'account', value: Account |}
  | {| type: 'accountUnclaimed', value: AccountUnclaimed |}
  | {| type: 'accountUnspent', value: AccountUnspent |}
  | {| type: 'action', value: Action |}
  | {| type: 'asset', value: Asset |}
  | {| type: 'block', value: Block |}
  | {| type: 'header', value: Header |}
  | {| type: 'transaction', value: Transaction |}
  | {| type: 'contract', value: Contract |}
  | {| type: 'storageItem', value: StorageItem |}
  | {| type: 'validator', value: Validator |}
  | {| type: 'blockSystemFee', value: BlockSystemFee |}
  | {| type: 'transactionSpentCoins', value: TransactionSpentCoins |}
  | {| type: 'invocationData', value: InvocationData |}
  | {| type: 'output', value: OutputValue |}
  | {| type: 'validatorsCount', value: ValidatorsCount |};
export type DeleteChange =
  | {| type: 'account', key: AccountKey |}
  | {| type: 'accountUnclaimed', key: AccountUnclaimedKey |}
  | {| type: 'accountUnspent', key: AccountUnspentKey |}
  | {| type: 'contract', key: ContractKey |}
  | {| type: 'storageItem', key: StorageItemKey |}
  | {| type: 'validator', key: ValidatorKey |};
export type Change =
  | {| type: 'add', change: AddChange |}
  | {| type: 'delete', change: DeleteChange |};
export type ChangeSet = Array<Change>;

interface LatestReadStorage<Key, Value> extends ReadStorage<Key, Value> {
  tryGetLatest: () => Promise<?Value>;
}

export type Storage = {
  account: $PropertyType<Blockchain, 'account'>,
  accountUnclaimed: $PropertyType<Blockchain, 'accountUnclaimed'>,
  accountUnspent: $PropertyType<Blockchain, 'accountUnspent'>,
  action: $PropertyType<Blockchain, 'action'>,
  asset: $PropertyType<Blockchain, 'asset'>,
  block: LatestReadStorage<BlockKey, Block>,
  blockSystemFee: $PropertyType<Blockchain, 'blockSystemFee'>,
  header: LatestReadStorage<HeaderKey, Header>,
  transaction: $PropertyType<Blockchain, 'transaction'>,
  transactionSpentCoins: $PropertyType<Blockchain, 'transactionSpentCoins'>,
  output: $PropertyType<Blockchain, 'output'>,
  contract: $PropertyType<Blockchain, 'contract'>,
  storageItem: $PropertyType<Blockchain, 'storageItem'>,
  validator: $PropertyType<Blockchain, 'validator'>,
  invocationData: $PropertyType<Blockchain, 'invocationData'>,
  validatorsCount: $PropertyType<Blockchain, 'validatorsCount'>,
  commit: (changeSet: ChangeSet) => Promise<void>,
  close: () => Promise<void>,
};
