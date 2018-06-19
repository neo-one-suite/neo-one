export type BlockchainInterfaceName =
  | 'AccountBase'
  | 'AssetBase'
  | 'AttributeBase'
  | 'BlockBase'
  | 'ContractBase'
  | 'HeaderBase'
  | 'InputBase'
  | 'OutputBase'
  | 'TransactionBase'
  | 'ValidatorBase'
  | 'StorageContextReadOnlyBase'
  | 'EnumeratorBase'
  | 'IteratorBase'
  | 'StorageContextBase';

export enum InternalBlockchainInterfaceProperties {
  BlockchainInterface = 'BlockchainInterface',
}
