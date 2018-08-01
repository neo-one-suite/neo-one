// tslint:disable
/// <reference path="./global.d.ts" />
interface SerializableValueArray extends Array<SerializableValue> {}
interface SerializableValueObject {
  [key: string]: SerializableValue;
}
type SerializableValue =
  | undefined
  | number
  | string
  | boolean
  | Buffer
  | SerializableValueArray
  | SerializableValueObject;
interface AccountBase {
  __brand: 'AccountBase';
}
interface AssetBase {
  __brand: 'AssetBase';
}
interface AttributeBase {
  __brand: 'AttributeBase';
}
interface BlockBase {
  __brand: 'BlockBase';
}
interface ContractBase {
  __brand: 'ContractBase';
}
interface HeaderBase {
  __brand: 'HeaderBase';
}
interface InputBase {
  __brand: 'InputBase';
}
interface OutputBase {
  __brand: 'OutputBase';
}
interface TransactionBase {
  __brand: 'TransactionBase';
}
interface ValidatorBase {
  __brand: 'ValidatorBase';
}
interface StorageContextBase {
  __brand: 'StorageContextBase';
}
interface StorageContextReadOnlyBase {
  __brand: 'StorageContextReadOnlyBase';
}
interface StorageIteratorBase {
  __brand: 'StorageIteratorBase';
}
declare function syscall(name: 'Neo.Runtime.GetTrigger'): number;
declare function syscall(name: 'Neo.Runtime.CheckWitness', witness: Buffer): boolean;
declare function syscall(
  name: 'Neo.Runtime.Notify',
  ...args: Array<Buffer | number | string | boolean | undefined>
): void;
declare function syscall(name: 'Neo.Runtime.Log', value: string): void;
declare function syscall(name: 'Neo.Runtime.GetTime'): number;
declare function syscall(name: 'Neo.Runtime.Serialize', value: SerializableValue): Buffer;
declare function syscall(name: 'Neo.Runtime.Deserialize', value: Buffer): SerializableValue;
declare function syscall(name: 'Neo.Blockchain.GetHeight'): number;
declare function syscall(name: 'Neo.Blockchain.GetHeader', hashOrIndex: Buffer | number): HeaderBase;
declare function syscall(name: 'Neo.Blockchain.GetBlock', hashOrIndex: Buffer | number): BlockBase;
declare function syscall(name: 'Neo.Blockchain.GetTransaction', hash: Buffer): TransactionBase;
declare function syscall(name: 'Neo.Blockchain.GetTransactionHeight', hash: Buffer): number;
declare function syscall(name: 'Neo.Blockchain.GetAccount', hash: Buffer): AccountBase;
declare function syscall(name: 'Neo.Blockchain.GetValidators'): Array<Buffer>;
declare function syscall(name: 'Neo.Blockchain.GetAsset', hash: Buffer): AssetBase;
declare function syscall(name: 'Neo.Blockchain.GetContract', hash: Buffer): ContractBase;
declare function syscall(name: 'Neo.Header.GetHash', blockOrHeader: BlockBase | HeaderBase): Buffer;
declare function syscall(name: 'Neo.Header.GetVersion', blockOrHeader: BlockBase | HeaderBase): number;
declare function syscall(name: 'Neo.Header.GetPrevHash', blockOrHeader: BlockBase | HeaderBase): Buffer;
declare function syscall(name: 'Neo.Header.GetIndex', blockOrHeader: BlockBase | HeaderBase): number;
declare function syscall(name: 'Neo.Header.GetMerkleRoot', blockOrHeader: BlockBase | HeaderBase): Buffer;
declare function syscall(name: 'Neo.Header.GetTimestamp', blockOrHeader: BlockBase | HeaderBase): number;
declare function syscall(name: 'Neo.Header.GetConsensusData', blockOrHeader: BlockBase | HeaderBase): number;
declare function syscall(name: 'Neo.Header.GetNextConsensus', blockOrHeader: BlockBase | HeaderBase): Buffer;
declare function syscall(name: 'Neo.Block.GetTransactionCount', block: BlockBase): number;
declare function syscall(name: 'Neo.Block.GetTransactions', block: BlockBase): Array<TransactionBase>;
declare function syscall(name: 'Neo.Block.GetTransaction', block: BlockBase, index: number): TransactionBase;
declare function syscall(name: 'Neo.Transaction.GetHash', transaction: TransactionBase): Buffer;
declare function syscall(name: 'Neo.Transaction.GetType', transaction: TransactionBase): number;
declare function syscall(name: 'Neo.Transaction.GetAttributes', transaction: TransactionBase): Array<AttributeBase>;
declare function syscall(name: 'Neo.Transaction.GetInputs', transaction: TransactionBase): Array<InputBase>;
declare function syscall(name: 'Neo.Transaction.GetOutputs', transaction: TransactionBase): Array<OutputBase>;
declare function syscall(name: 'Neo.Transaction.GetReferences', transaction: TransactionBase): Array<OutputBase>;
declare function syscall(name: 'Neo.Transaction.GetUnspentCoins', transaction: TransactionBase): Array<OutputBase>;
declare function syscall(name: 'Neo.InvocationTransaction.GetScript', transaction: TransactionBase): Buffer;
declare function syscall(name: 'Neo.Attribute.GetUsage', attribute: AttributeBase): number;
declare function syscall(name: 'Neo.Attribute.GetData', attribute: AttributeBase): Buffer;
declare function syscall(name: 'Neo.Input.GetHash', input: InputBase): Buffer;
declare function syscall(name: 'Neo.Input.GetIndex', input: InputBase): number;
declare function syscall(name: 'Neo.Output.GetAssetId', output: OutputBase): Buffer;
declare function syscall(name: 'Neo.Output.GetValue', output: OutputBase): number;
declare function syscall(name: 'Neo.Output.GetScriptHash', output: OutputBase): Buffer;
declare function syscall(name: 'Neo.Account.GetScriptHash', account: AccountBase): Buffer;
declare function syscall(name: 'Neo.Account.GetVotes', account: AccountBase): Array<Buffer>;
declare function syscall(name: 'Neo.Account.GetBalance', account: AccountBase, assetHash: Buffer): number;
declare function syscall(name: 'Neo.Asset.GetAssetId', asset: AssetBase): Buffer;
declare function syscall(name: 'Neo.Asset.GetAssetType', asset: AssetBase): number;
declare function syscall(name: 'Neo.Asset.GetAmount', asset: AssetBase): number;
declare function syscall(name: 'Neo.Asset.GetAvailable', asset: AssetBase): number;
declare function syscall(name: 'Neo.Asset.GetPrecision', asset: AssetBase): number;
declare function syscall(name: 'Neo.Asset.GetOwner', asset: AssetBase): Buffer;
declare function syscall(name: 'Neo.Asset.GetAdmin', asset: AssetBase): Buffer;
declare function syscall(name: 'Neo.Asset.GetIssuer', asset: AssetBase): Buffer;
declare function syscall(name: 'Neo.Contract.GetScript', contract: ContractBase): Buffer;
declare function syscall(name: 'Neo.Storage.GetContext'): StorageContextBase;
declare function syscall(name: 'Neo.Storage.GetReadOnlyContext'): StorageContextReadOnlyBase;
declare function syscall(
  name: 'Neo.StorageContext.AsReadOnly',
  context: StorageContextBase,
): StorageContextReadOnlyBase;
declare function syscall(
  name: 'Neo.Storage.Get',
  context: StorageContextBase | StorageContextReadOnlyBase,
  key: Buffer | string,
): SerializableValue;
declare function syscall(
  name: 'Neo.Storage.Find',
  context: StorageContextBase | StorageContextReadOnlyBase,
  prefix: Buffer | string,
): StorageIteratorBase;
declare function syscall(name: 'Neo.Enumerator.Next', iterator: StorageIteratorBase): boolean;
declare function syscall(name: 'Neo.Iterator.Key', iterator: StorageIteratorBase): Buffer | string;
declare function syscall(
  name: 'Neo.Enumerator.Value',
  iterator: StorageIteratorBase,
): Buffer | number | string | boolean;
declare function syscall(name: 'Neo.Account.SetVotes', account: AccountBase, votes: Array<Buffer>): void;
declare function syscall(name: 'Neo.Validator.Register', publicKey: Buffer): ValidatorBase;
declare function syscall(
  name: 'Neo.Asset.Create',
  assetType: number,
  assetName: string,
  amount: number,
  precision: number,
  owner: Buffer,
  admin: Buffer,
  issuer: Buffer,
): AssetBase;
declare function syscall(name: 'Neo.Asset.Renew', asset: AssetBase, years: number): number;
declare function syscall(
  name: 'Neo.Contract.Create',
  script: Buffer,
  parameterList: Buffer,
  returnType: number,
  properties: number,
  contractName: string,
  codeVersion: string,
  author: string,
  email: string,
  description: string,
): ContractBase;
declare function syscall(
  name: 'Neo.Contract.Migrate',
  script: Buffer,
  parameterList: Buffer,
  returnType: number,
  properties: number,
  contractName: string,
  codeVersion: string,
  author: string,
  email: string,
  description: string,
): ContractBase;
declare function syscall(name: 'Neo.Contract.GetStorageContext', contract: ContractBase): StorageContextBase;
declare function syscall(name: 'Neo.Contract.Destroy'): void;
declare function syscall(
  name: 'Neo.Storage.Put',
  context: StorageContextBase,
  key: Buffer | string,
  value: SerializableValue,
): void;
declare function syscall(name: 'Neo.Storage.Delete', context: StorageContextBase, key: Buffer | string): void;
declare function syscall(name: 'System.ExecutionEngine.GetScriptContainer'): TransactionBase;
declare function syscall(name: 'System.ExecutionEngine.GetExecutingScriptHash'): Buffer;
declare function syscall(name: 'System.ExecutionEngine.GetCallingScriptHash'): Buffer;
declare function syscall(name: 'System.ExecutionEngine.GetEntryScriptHash'): Buffer;
declare function syscall(name: 'Neo.Runtime.Return', value: Buffer | number | string | boolean): void;
declare function syscall(name: 'Neo.Runtime.GetArgument', idx: number): any;
declare function syscall(name: 'Neo.Runtime.Call', hash: Buffer, ...args: Array<SerializableValue>): SerializableValue;
