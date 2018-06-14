declare global {
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
  interface StorageIteratorBase {
    __brand: 'StorageIteratorBase';
  }
  function syscall(name: 'Neo.Runtime.GetTrigger'): number;
  function syscall(name: 'Neo.Runtime.CheckWitness', witness: Buffer): boolean;
  function syscall(name: 'Neo.Runtime.Notify', ...args: Array<Buffer | number | string | boolean>): void;
  function syscall(name: 'Neo.Runtime.Log', value: string): void;
  function syscall(name: 'Neo.Runtime.GetTime'): number;
  function syscall(name: 'Neo.Runtime.Serialize', value: SerializableValue): Buffer;
  function syscall(name: 'Neo.Runtime.Deserialize', value: Buffer): SerializableValue;
  function syscall(name: 'Neo.Blockchain.GetHeight'): number;
  function syscall(name: 'Neo.Blockchain.GetHeader', hashOrIndex: Buffer | number): HeaderBase;
  function syscall(name: 'Neo.Blockchain.GetBlock', hashOrIndex: Buffer | number): BlockBase;
  function syscall(name: 'Neo.Blockchain.GetTransaction', hash: Buffer): TransactionBase;
  function syscall(name: 'Neo.Blockchain.GetAccount', hash: Buffer): AccountBase;
  function syscall(name: 'Neo.Blockchain.GetValidators'): Array<Buffer>;
  function syscall(name: 'Neo.Blockchain.GetAsset', hash: Buffer): AssetBase;
  function syscall(name: 'Neo.Blockchain.GetContract', hash: Buffer): ContractBase;
  function syscall(name: 'Neo.Header.GetHash', blockOrHeader: BlockBase | HeaderBase): Buffer;
  function syscall(name: 'Neo.Header.GetVersion', blockOrHeader: BlockBase | HeaderBase): number;
  function syscall(name: 'Neo.Header.GetPrevHash', blockOrHeader: BlockBase | HeaderBase): Buffer;
  function syscall(name: 'Neo.Header.GetIndex', blockOrHeader: BlockBase | HeaderBase): number;
  function syscall(name: 'Neo.Header.GetMerkleRoot', blockOrHeader: BlockBase | HeaderBase): Buffer;
  function syscall(name: 'Neo.Header.GetTimestamp', blockOrHeader: BlockBase | HeaderBase): number;
  function syscall(name: 'Neo.Header.GetConsensusData', blockOrHeader: BlockBase | HeaderBase): number;
  function syscall(name: 'Neo.Header.GetNextConsensus', blockOrHeader: BlockBase | HeaderBase): Buffer;
  function syscall(name: 'Neo.Block.GetTransactionCount', block: BlockBase): number;
  function syscall(name: 'Neo.Block.GetTransactions', block: BlockBase): Array<TransactionBase>;
  function syscall(name: 'Neo.Block.GetTransaction', block: BlockBase, index: number): TransactionBase;
  function syscall(name: 'Neo.Transaction.GetHash', transaction: TransactionBase): Buffer;
  function syscall(name: 'Neo.Transaction.GetType', transaction: TransactionBase): number;
  function syscall(name: 'Neo.Transaction.GetAttributes', transaction: TransactionBase): Array<AttributeBase>;
  function syscall(name: 'Neo.Transaction.GetInputs', transaction: TransactionBase): Array<InputBase>;
  function syscall(name: 'Neo.Transaction.GetOutputs', transaction: TransactionBase): Array<OutputBase>;
  function syscall(name: 'Neo.Transaction.GetReferences', transaction: TransactionBase): Array<OutputBase>;
  function syscall(name: 'Neo.Transaction.GetUnspentCoins', transaction: TransactionBase): Array<OutputBase>;
  function syscall(name: 'Neo.InvocationTransaction.GetScript', transaction: TransactionBase): Buffer;
  function syscall(name: 'Neo.Attribute.GetUsage', attribute: AttributeBase): number;
  function syscall(name: 'Neo.Attribute.GetData', attribute: AttributeBase): Buffer;
  function syscall(name: 'Neo.Input.GetHash', input: InputBase): Buffer;
  function syscall(name: 'Neo.Input.GetIndex', input: InputBase): number;
  function syscall(name: 'Neo.Output.GetAssetId', output: OutputBase): Buffer;
  function syscall(name: 'Neo.Output.GetValue', output: OutputBase): number;
  function syscall(name: 'Neo.Output.GetScriptHash', output: OutputBase): Buffer;
  function syscall(name: 'Neo.Account.GetScriptHash', account: AccountBase): Buffer;
  function syscall(name: 'Neo.Account.GetVotes', account: AccountBase): Array<Buffer>;
  function syscall(name: 'Neo.Account.GetBalance', account: AccountBase, assetHash: Buffer): number;
  function syscall(name: 'Neo.Asset.GetAssetId', asset: AssetBase): Buffer;
  function syscall(name: 'Neo.Asset.GetAssetType', asset: AssetBase): number;
  function syscall(name: 'Neo.Asset.GetAmount', asset: AssetBase): number;
  function syscall(name: 'Neo.Asset.GetAvailable', asset: AssetBase): number;
  function syscall(name: 'Neo.Asset.GetPrecision', asset: AssetBase): number;
  function syscall(name: 'Neo.Asset.GetOwner', asset: AssetBase): Buffer;
  function syscall(name: 'Neo.Asset.GetAdmin', asset: AssetBase): Buffer;
  function syscall(name: 'Neo.Asset.GetIssuer', asset: AssetBase): Buffer;
  function syscall(name: 'Neo.Contract.GetScript', contract: ContractBase): Buffer;
  function syscall(name: 'Neo.Storage.GetContext'): StorageContextBase;
  function syscall(name: 'Neo.Storage.Get', context: StorageContextBase, key: Buffer | string): SerializableValue;
  function syscall(name: 'Neo.Storage.Find', context: StorageContextBase, prefix: Buffer | string): StorageIteratorBase;
  function syscall(name: 'Neo.Iterator.Next', iterator: StorageIteratorBase): boolean;
  function syscall(name: 'Neo.Iterator.Key', iterator: StorageIteratorBase): Buffer | string;
  function syscall(name: 'Neo.Iterator.Value', iterator: StorageIteratorBase): Buffer | number | string | boolean;
  function syscall(name: 'Neo.Account.SetVotes', account: AccountBase, votes: Array<Buffer>): void;
  function syscall(name: 'Neo.Validator.Register', publicKey: Buffer): ValidatorBase;
  function syscall(
    name: 'Neo.Asset.Create',
    assetType: number,
    assetName: string,
    amount: number,
    precision: number,
    owner: Buffer,
    admin: Buffer,
    issuer: Buffer,
  ): AssetBase;
  function syscall(name: 'Neo.Asset.Renew', asset: AssetBase, years: number): number;
  function syscall(
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
  function syscall(
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
  function syscall(name: 'Neo.Contract.GetStorageContext', contract: ContractBase): StorageContextBase;
  function syscall(name: 'Neo.Contract.Destroy'): void;
  function syscall(
    name: 'Neo.Storage.Put',
    context: StorageContextBase,
    key: Buffer | string,
    value: SerializableValue,
  ): void;
  function syscall(name: 'Neo.Storage.Delete', context: StorageContextBase, key: Buffer | string): void;
  function syscall(name: 'System.ExecutionEngine.GetScriptContainer'): TransactionBase;
  function syscall(name: 'System.ExecutionEngine.GetExecutingScriptHash'): Buffer;
  function syscall(name: 'System.ExecutionEngine.GetCallingScriptHash'): Buffer;
  function syscall(name: 'System.ExecutionEngine.GetEntryScriptHash'): Buffer;
  function syscall(name: 'Neo.Runtime.Return', value: Buffer | number | string | boolean): void;
  function syscall(name: 'Neo.Runtime.GetArgument', idx: number): any;
}

export {
  Address,
  Hash256,
  PublicKey,
  Signature,
  Fixed,
  Integer,
  Fixed8,
  SmartContract,
  MapStorage,
  SetStorage,
  Output,
  Input,
  AttributeUsage,
  Attribute,
  TransactionType,
  Transaction,
  BaseBlock,
  Header,
  Block,
  Account,
  AssetType,
  Asset,
  Contract,
  verifySender,
  getCurrentTransaction,
  getCurrentTime,
  getHeight,
  getHeader,
  getBlock,
  getTransaction,
  getAccount,
  getAsset,
  getValidators,
  getContract,
  verify,
  constant,
  createEventHandler,
} from './lib';
