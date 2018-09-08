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
  ForwardValue = 11,
  IteratorResult = 12,
  IterableIterator = 13,
  Error = 14,
  ArrayStorage = 15,
  MapStorage = 16,
  SetStorage = 17,
  Transaction = 18,
  Output = 19,
  Attribute = 20,
  Input = 21,
  Account = 22,
  Asset = 23,
  Contract = 24,
  Header = 25,
  Block = 26,
  // Fake type, never appears
  Iterable = 27,
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
  | Types.ForwardValue
  | Types.IteratorResult
  | Types.IterableIterator
  | Types.Error
  | Types.ArrayStorage
  | Types.MapStorage
  | Types.SetStorage
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
