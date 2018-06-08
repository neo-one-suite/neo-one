export type Address = Buffer;
export type Hash256 = Buffer;
export type PublicKey = Buffer;
export type Signature = Buffer;
export type Fixed<T extends number> = number & (number | T);
export type Integer = Fixed<0>;
export type Fixed8 = Fixed<8>;

export abstract class SmartContract {
  constructor(public readonly owner: Address) {}

  protected get address(): Address {
    return syscall('System.ExecutionEngine.GetExecutingScriptHash');
  }
}

export class MapStorage<
  K extends SerializableValue,
  V extends SerializableValue
> {
  constructor(private readonly prefix?: Buffer) {}

  public get(keyIn: K): V | null {
    return syscall(
      'Neo.Storage.Get',
      syscall('Neo.Storage.GetContext'),
      this.prefix == null
        ? syscall('Neo.Runtime.Serialize', keyIn)
        : Buffer.concat([this.prefix, syscall('Neo.Runtime.Serialize', keyIn)]),
    ) as V | null;
  }

  public set(keyIn: K, value: V): void {
    syscall(
      'Neo.Storage.Put',
      syscall('Neo.Storage.GetContext'),
      this.prefix == null
        ? syscall('Neo.Runtime.Serialize', keyIn)
        : Buffer.concat([this.prefix, syscall('Neo.Runtime.Serialize', keyIn)]),
      value,
    );
  }
}

export class SetStorage<K extends SerializableValue> {
  constructor(private readonly prefix?: Buffer) {}

  public has(keyIn: K): boolean {
    return (
      syscall(
        'Neo.Storage.Get',
        syscall('Neo.Storage.GetContext'),
        this.prefix == null
          ? syscall('Neo.Runtime.Serialize', keyIn)
          : Buffer.concat(
              [this.prefix, syscall('Neo.Runtime.Serialize', keyIn)],
            ),
      ) === true
    );
  }

  public add(keyIn: K): void {
    syscall(
      'Neo.Storage.Put',
      syscall('Neo.Storage.GetContext'),
      this.prefix == null
        ? syscall('Neo.Runtime.Serialize', keyIn)
        : Buffer.concat([this.prefix, syscall('Neo.Runtime.Serialize', keyIn)]),
      true,
    );
  }
}

export class Output {
  constructor(private readonly output: OutputBase) {}

  public get address(): Address {
    return syscall('Neo.Output.GetScriptHash', this.output);
  }

  public get asset(): Hash256 {
    return syscall('Neo.Output.GetAssetId', this.output);
  }

  public get value(): Fixed8 {
    return syscall('Neo.Output.GetValue', this.output);
  }
}

export class Input {
  constructor(private readonly input: InputBase) {}

  public get hash(): Hash256 {
    return syscall('Neo.Input.GetHash', this.input);
  }

  public get index(): Integer {
    return syscall('Neo.Input.GetIndex', this.input);
  }
}

export type AttributeUsage =
  | 0x00 // CONTRACT_HASH
  | 0x02 // ECDH02
  | 0x03 // ECDH03
  | 0x20 // SCRIPT
  | 0x30 // VOTE
  | 0x81 // DESCRIPTION_URL
  | 0x90 // DESCRIPTION
  | 0xa1 // HASH1
  | 0xa2 // HASH2
  | 0xa3 // HASH3
  | 0xa4 // HASH4
  | 0xa5 // HASH5
  | 0xa6 // HASH6
  | 0xa7 // HASH7
  | 0xa8 // HASH8
  | 0xa9 // HASH9
  | 0xaa // HASH10
  | 0xab // HASH11
  | 0xac // HASH12
  | 0xad // HASH13
  | 0xae // HASH14
  | 0xaf // HASH15
  | 0xf0 // REMARK
  | 0xf1 // REMARK1
  | 0xf2 // REMARK2
  | 0xf3 // REMARK3
  | 0xf4 // REMARK4
  | 0xf5 // REMARK5
  | 0xf6 // REMARK6
  | 0xf7 // REMARK7
  | 0xf8 // REMARK8
  | 0xf9 // REMARK9
  | 0xfa // REMARK10
  | 0xfb // REMARK11
  | 0xfc // REMARK12
  | 0xfd // REMARK13
  | 0xfe // REMARK14
  | 0xff; // REMARK15

export class Attribute {
  constructor(private readonly attribute: AttributeBase) {}

  public get usage(): AttributeUsage {
    return syscall('Neo.Attribute.GetUsage', this.attribute) as AttributeUsage;
  }

  public get data(): Buffer {
    return syscall('Neo.Attribute.GetData', this.attribute);
  }
}

export type TransactionType =
  | 0x00 // Miner
  | 0x01 // Issue
  | 0x02 // Claim
  | 0x20 // Enrollment
  | 0x40 // Register
  | 0x80 // Contract
  | 0x90 // State
  | 0xd0 // Publish
  | 0xd1; // Invocation

export class Transaction {
  private readonly transaction: TransactionBase;

  constructor(transaction: TransactionBase) {
    this.transaction = transaction;
  }

  public get hash(): Hash256 {
    return syscall('Neo.Transaction.GetHash', this.transaction);
  }

  public get type(): TransactionType {
    return syscall(
      'Neo.Transaction.GetType',
      this.transaction,
    ) as TransactionType;
  }

  public get attributes(): Attribute[] {
    return syscall('Neo.Transaction.GetAttributes', this.transaction).map(
      (attribute) => new Attribute(attribute),
    );
  }

  public get outputs(): Output[] {
    return syscall('Neo.Transaction.GetOutputs', this.transaction).map(
      (output) => new Output(output),
    );
  }

  public get inputs(): Input[] {
    return syscall('Neo.Transaction.GetInputs', this.transaction).map(
      (input) => new Input(input),
    );
  }

  public get references(): Output[] {
    return syscall('Neo.Transaction.GetReferences', this.transaction).map(
      (output) => new Output(output),
    );
  }

  public get unspentOutputs(): Output[] {
    return syscall('Neo.Transaction.GetUnspentCoins', this.transaction).map(
      (output) => new Output(output),
    );
  }

  public get script(): Buffer {
    return syscall('Neo.InvocationTransaction.GetScript', this.transaction);
  }
}

export abstract class BaseBlock<T extends HeaderBase | BlockBase> {
  constructor(protected readonly block: T) {}

  public get hash(): Hash256 {
    return syscall('Neo.Header.GetHash', this.block);
  }

  public get version(): Integer {
    return syscall('Neo.Header.GetVersion', this.block);
  }

  public get previousHash(): Hash256 {
    return syscall('Neo.Header.GetPrevHash', this.block);
  }

  public get index(): Integer {
    return syscall('Neo.Header.GetIndex', this.block);
  }

  public get merkleRoot(): Hash256 {
    return syscall('Neo.Header.GetMerkleRoot', this.block);
  }

  public get timestamp(): Integer {
    return syscall('Neo.Header.GetTimestamp', this.block);
  }

  public get consensusData(): Integer {
    return syscall('Neo.Header.GetConsensusData', this.block);
  }

  public get nextConsensus(): Address {
    return syscall('Neo.Header.GetNextConsensus', this.block);
  }
}

export class Header extends BaseBlock<HeaderBase> {}
export class Block extends BaseBlock<BlockBase> {
  public get transactionCount(): Integer {
    return syscall('Neo.Block.GetTransactionCount', this.block);
  }

  public get transactions(): Transaction[] {
    return syscall('Neo.Block.GetTransactions', this.block).map(
      (transaction) => new Transaction(transaction),
    );
  }

  public getTransaction(index: Integer): Transaction {
    return new Transaction(
      syscall('Neo.Block.GetTransaction', this.block, index),
    );
  }
}

export class Account {
  constructor(private readonly account: AccountBase) {}

  public get hash(): Address {
    return syscall('Neo.Account.GetScriptHash', this.account);
  }

  public getBalance(asset: Hash256): Fixed8 {
    return syscall('Neo.Account.GetBalance', this.account, asset);
  }

  public get votes(): PublicKey[] {
    return syscall('Neo.Account.GetVotes', this.account);
  }

  public set votes(votes: PublicKey[]) {
    syscall('Neo.Account.SetVotes', this.account, votes);
  }
}

export type AssetType =
  | 0x40 // Credit
  | 0x80 // Duty
  | 0x00 // Governing
  | 0x01 // Utility
  | 0x08 // Currency
  | 0x90 // Share
  | 0x98 // Invoice
  | 0x60; // Token

export class Asset {
  constructor(private readonly asset: AssetBase) {}

  public get hash(): Hash256 {
    return syscall('Neo.Asset.GetAssetId', this.asset);
  }

  public get type(): AssetType {
    return syscall('Neo.Asset.GetAssetType', this.asset) as AssetType;
  }

  public get amount(): Fixed8 {
    return syscall('Neo.Asset.GetAmount', this.asset);
  }

  public get available(): Fixed8 {
    return syscall('Neo.Asset.GetAvailable', this.asset);
  }

  public get precision(): Integer {
    return syscall('Neo.Asset.GetPrecision', this.asset);
  }

  public get owner(): PublicKey {
    return syscall('Neo.Asset.GetOwner', this.asset);
  }

  public get admin(): Address {
    return syscall('Neo.Asset.GetAdmin', this.asset);
  }

  public get issuer(): Address {
    return syscall('Neo.Asset.GetIssuer', this.asset);
  }
}

export class Contract extends Account {
  constructor(private readonly contract: ContractBase, account: AccountBase) {
    super(account);
  }

  public get script(): Buffer {
    return syscall('Neo.Contract.GetScript', this.contract);
  }
}

export function verifySender(addr: Address): void {
  if (!syscall('Neo.Runtime.CheckWitness', addr)) {
    throw new Error('Invalid witness');
  }
}

export function getCurrentTransaction(): Transaction {
  return new Transaction(syscall('System.ExecutionEngine.GetScriptContainer'));
}

export function getCurrentTime(): Integer {
  return syscall('Neo.Runtime.GetTime');
}

export function getHeight(): Integer {
  return syscall('Neo.Blockchain.GetHeight');
}

export function getHeader(indexOrHash: Integer | Hash256): Header {
  return new Header(syscall('Neo.Blockchain.GetHeader', indexOrHash));
}

export function getBlock(indexOrHash: Integer | Hash256): Block {
  return new Block(syscall('Neo.Blockchain.GetBlock', indexOrHash));
}

export function getTransaction(hash: Hash256): Transaction {
  return new Transaction(syscall('Neo.Blockchain.GetTransaction', hash));
}

export function getAccount(address: Address): Account {
  return new Account(syscall('Neo.Blockchain.GetAccount', address));
}

export function getAsset(asset: Hash256): Asset {
  return new Asset(syscall('Neo.Blockchain.GetAsset', asset));
}

export function getValidators(): PublicKey[] {
  return syscall('Neo.Blockchain.GetValidators');
}

export function getContract(address: Address): Contract {
  return new Contract(
    syscall('Neo.Blockchain.GetContract', address),
    syscall('Neo.Blockchain.GetAccount', address),
  );
}

export function verify(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  throw new Error('This should be transpiled.');
}
export function constant(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  throw new Error('This should be transpiled.');
}

export function createEventHandler(name: string): () => void;
export function createEventHandler<A0>(
  name: string,
  arg0Name: string,
): (arg0: A0) => void;
export function createEventHandler<A0, A1>(
  name: string,
  arg0Name: string,
  arg1Name: string,
): (arg0: A0, arg1: A1) => void;
export function createEventHandler<A0, A1, A2>(
  name: string,
  arg0Name: string,
  arg1Name: string,
  arg2Name: string,
): (arg0: A0, arg1: A1, arg2: A2) => void;
export function createEventHandler(
  name: string,
  // tslint:disable-next-line
  ...args: any[]
): (...args: any[]) => void {
  throw new Error('This should be transpiled');
}
