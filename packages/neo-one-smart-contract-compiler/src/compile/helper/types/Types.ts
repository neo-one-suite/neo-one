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
  // Map = 9,
  // Set = 10,
  Transaction = 11,
  Output = 12,
  Attribute = 13,
  Input = 14,
  Account = 15,
  Asset = 16,
  Contract = 17,
  Header = 18,
  Block = 19,
}

export type WrappableType =
  | Types.Boolean
  | Types.String
  | Types.Symbol
  | Types.Number
  | Types.Object
  | Types.Array
  | Types.Buffer
  | Types.Transaction
  | Types.Output
  | Types.Attribute
  | Types.Input
  | Types.Account
  | Types.Asset
  | Types.Contract
  | Types.Header
  | Types.Block;
