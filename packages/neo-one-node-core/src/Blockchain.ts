import { ECPoint } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Observable } from 'rxjs';
import { Account, AccountKey, AccountUpdate } from './Account';
import { AccountUnclaimed, AccountUnclaimedKey, AccountUnclaimedsKey } from './AccountUnclaimed';
import { AccountUnspent, AccountUnspentKey, AccountUnspentsKey } from './AccountUnspent';
import { Action, ActionKey, ActionsKey } from './action';
import { Asset, AssetKey, AssetUpdate } from './Asset';
import { Block, BlockKey } from './Block';
import { BlockData, BlockDataKey } from './BlockData';
import { CallReceipt } from './CallReceipt';
import { Contract, ContractKey } from './Contract';
import { Header, HeaderKey } from './Header';
import { InvocationData, InvocationDataKey } from './InvocationData';
import { ConsensusPayload } from './payload';
import { DeserializeWireContext, SerializeJSONContext } from './Serializable';
import { Settings } from './Settings';
import { StorageItem, StorageItemKey, StorageItemsKey, StorageItemUpdate } from './StorageItem';
import {
  FeeContext,
  Input,
  InvocationTransaction,
  Output,
  OutputKey,
  Transaction,
  TransactionKey,
} from './transaction';
import { TransactionData, TransactionDataKey, TransactionDataUpdate } from './TransactionData';
import { Validator, ValidatorKey } from './Validator';
import { ValidatorsCount, ValidatorsCountUpdate } from './ValidatorsCount';
import { VerifyScriptResult } from './vm';

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

export interface BlockchainStorage {
  readonly account: ReadAllStorage<AccountKey, Account>;
  readonly accountUnclaimed: ReadGetAllStorage<AccountUnclaimedKey, AccountUnclaimedsKey, AccountUnclaimed>;
  readonly accountUnspent: ReadGetAllStorage<AccountUnspentKey, AccountUnspentsKey, AccountUnspent>;
  readonly action: ReadGetAllStorage<ActionKey, ActionsKey, Action>;
  readonly asset: ReadStorage<AssetKey, Asset>;
  readonly block: ReadStorage<BlockKey, Block>;
  readonly blockData: ReadStorage<BlockDataKey, BlockData>;
  readonly header: ReadStorage<HeaderKey, Header>;
  readonly transaction: ReadStorage<TransactionKey, Transaction>;
  readonly transactionData: ReadStorage<TransactionDataKey, TransactionData>;
  readonly output: ReadStorage<OutputKey, Output>;
  readonly contract: ReadStorage<ContractKey, Contract>;
  readonly storageItem: ReadGetAllStorage<StorageItemKey, StorageItemsKey, StorageItem>;
  readonly validator: ReadAllStorage<ValidatorKey, Validator>;
  readonly invocationData: ReadStorage<InvocationDataKey, InvocationData>;
  readonly validatorsCount: ReadMetadataStorage<ValidatorsCount>;
}

export interface VerifyTransactionResult {
  readonly verifications: readonly VerifyScriptResult[];
}

export interface Blockchain extends BlockchainStorage {
  readonly settings: Settings;
  readonly deserializeWireContext: DeserializeWireContext;
  readonly serializeJSONContext: SerializeJSONContext;
  readonly feeContext: FeeContext;

  readonly currentBlock: Block;
  readonly previousBlock: Block | undefined;
  readonly currentHeader: Header;
  readonly currentBlockIndex: number;
  readonly block$: Observable<Block>;
  readonly isPersistingBlock: boolean;

  readonly persistBlock: (options: { readonly block: Block; readonly unsafe?: boolean }) => Promise<void>;
  readonly persistHeaders: (headers: readonly Header[]) => Promise<void>;

  readonly verifyBlock: (block: Block) => Promise<void>;
  readonly verifyTransaction: (param0: {
    readonly transaction: Transaction;
    readonly memPool?: readonly Transaction[];
  }) => Promise<VerifyTransactionResult>;
  readonly verifyConsensusPayload: (payload: ConsensusPayload) => Promise<void>;

  readonly getValidators: (transactions: readonly Transaction[]) => Promise<readonly ECPoint[]>;

  readonly invokeScript: (script: Buffer) => Promise<CallReceipt>;
  readonly invokeTransaction: (transaction: InvocationTransaction) => Promise<CallReceipt>;
  readonly calculateClaimAmount: (inputs: readonly Input[]) => Promise<BN>;

  readonly updateSettings: (settings: Settings) => void;
  readonly stop: () => Promise<void>;
  readonly reset: () => Promise<void>;
}

export interface WriteBlockchain {
  readonly settings: Blockchain['settings'];
  readonly currentBlock: Blockchain['currentBlock'];
  readonly currentHeader: Blockchain['currentHeader'];
  readonly currentBlockIndex: number;
  readonly getValidators: Blockchain['getValidators'];
  readonly account: ReadAllAddUpdateDeleteStorage<AccountKey, Account, AccountUpdate>;
  readonly accountUnclaimed: ReadGetAllAddDeleteStorage<AccountUnclaimedKey, AccountUnclaimedsKey, AccountUnclaimed>;
  readonly accountUnspent: ReadGetAllAddDeleteStorage<AccountUnspentKey, AccountUnspentsKey, AccountUnspent>;
  readonly action: ReadGetAllAddStorage<ActionKey, ActionsKey, Action>;
  readonly asset: ReadAddUpdateStorage<AssetKey, Asset, AssetUpdate>;
  readonly block: ReadAddStorage<BlockKey, Block>;
  readonly blockData: ReadAddStorage<BlockDataKey, BlockData>;
  readonly header: ReadAddStorage<HeaderKey, Header>;
  readonly transaction: ReadAddStorage<TransactionKey, Transaction>;
  readonly transactionData: ReadAddUpdateStorage<TransactionDataKey, TransactionData, TransactionDataUpdate>;
  readonly output: Blockchain['output'];
  readonly contract: ReadAddDeleteStorage<ContractKey, Contract>;
  readonly storageItem: ReadGetAllAddUpdateDeleteStorage<
    StorageItemKey,
    StorageItemsKey,
    StorageItem,
    StorageItemUpdate
  >;
  readonly validator: ReadAllAddStorage<ValidatorKey, Validator>;
  readonly invocationData: ReadAddStorage<InvocationDataKey, InvocationData>;
  readonly validatorsCount: ReadAddUpdateMetadataStorage<ValidatorsCount, ValidatorsCountUpdate>;
}
