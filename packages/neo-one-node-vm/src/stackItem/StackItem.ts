import { AccountStackItem } from './AccountStackItem';
import { ArrayStackItem } from './ArrayStackItem';
import { AssetStackItem } from './AssetStackItem';
import { AttributeStackItem } from './AttributeStackItem';
import { BlockStackItem } from './BlockStackItem';
import { BooleanStackItem } from './BooleanStackItem';
import { BufferStackItem } from './BufferStackItem';
import { ConsensusPayloadStackItem } from './ConsensusPayloadStackItem';
import { ContractStackItem } from './ContractStackItem';
import { ECPointStackItem } from './ECPointStackItem';
import { EnumeratorStackItem } from './EnumeratorStackItem';
import { HeaderStackItem } from './HeaderStackItem';
import { InputStackItem } from './InputStackItem';
import { IntegerStackItem } from './IntegerStackItem';
import { IteratorStackItem } from './IteratorStackItem';
import { MapStackItem } from './MapStackItem';
import { OutputStackItem } from './OutputStackItem';
import { StorageContextStackItem } from './StorageContextStackItem';
import { StructStackItem } from './StructStackItem';
import { TransactionStackItem } from './TransactionStackItem';
import { UInt160StackItem } from './UInt160StackItem';
import { UInt256StackItem } from './UInt256StackItem';
import { ValidatorStackItem } from './ValidatorStackItem';

export type StackItem =
  | ArrayStackItem
  | BooleanStackItem
  | BufferStackItem
  | ConsensusPayloadStackItem
  | EnumeratorStackItem
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
