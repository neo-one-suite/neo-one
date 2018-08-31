export enum Types {
  Undefined = 0,
  Null = 1,
  Boolean = 2,
  String = 3,
  Symbol = 4,
  Number = 5,
  Object = 6,
  Array = 7,
  Buffer = 8,
  Map = 9,
  Set = 10,
  ArrayStorage = 11,
  MapStorage = 12,
  SetStorage = 13,
  Error = 14,
  IteratorResult = 15,
  IterableIterator = 16,
  Transaction = 17,
  Output = 18,
  Attribute = 19,
  Input = 20,
  Account = 21,
  Asset = 22,
  Contract = 23,
  Header = 24,
  Block = 25,
  // Fake type, never appears
  Iterable = 26,
}

export type WrappableType =
  | Types.Boolean
  | Types.String
  | Types.Symbol
  | Types.Number
  | Types.Object
  | Types.Array
  | Types.Buffer
  | Types.Map
  | Types.Set
  | Types.ArrayStorage
  | Types.MapStorage
  | Types.SetStorage
  | Types.Error
  | Types.IteratorResult
  | Types.IterableIterator
  | Types.Transaction
  | Types.Output
  | Types.Attribute
  | Types.Input
  | Types.Account
  | Types.Asset
  | Types.Contract
  | Types.Header
  | Types.Block;

export type IterableTypes =
  | Types.Array
  | Types.ArrayStorage
  | Types.Map
  | Types.MapStorage
  | Types.Set
  | Types.SetStorage
  | Types.IterableIterator;
