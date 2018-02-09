/* @flow */
import ArrayStackItem from './ArrayStackItem';
import BooleanStackItem from './BooleanStackItem';
import BufferStackItem from './BufferStackItem';
import UInt160StackItem from './UInt160StackItem';
import UInt256StackItem from './UInt256StackItem';
import IntegerStackItem from './IntegerStackItem';
import HeaderStackItem from './HeaderStackItem';
import BlockStackItem from './BlockStackItem';
import ContractStackItem from './ContractStackItem';
import TransactionStackItem from './TransactionStackItem';
import AccountStackItem from './AccountStackItem';
import AssetStackItem from './AssetStackItem';
import AttributeStackItem from './AttributeStackItem';
import InputStackItem from './InputStackItem';
import IteratorStackItem from './IteratorStackItem';
import MapStackItem from './MapStackItem';
import OutputStackItem from './OutputStackItem';
import ValidatorStackItem from './ValidatorStackItem';
import StorageContextStackItem from './StorageContextStackItem';
import ECPointStackItem from './ECPointStackItem';
import StructStackItem from './StructStackItem';

export type StackItem =
  | ArrayStackItem
  | BooleanStackItem
  | BufferStackItem
  | UInt160StackItem
  | UInt256StackItem
  | IntegerStackItem
  | HeaderStackItem
  | BlockStackItem
  | ContractStackItem
  | TransactionStackItem
  | AccountStackItem
  | AssetStackItem
  | AttributeStackItem
  | InputStackItem
  | IteratorStackItem
  | MapStackItem
  | OutputStackItem
  | ValidatorStackItem
  | StorageContextStackItem
  | ECPointStackItem
  | StructStackItem;
