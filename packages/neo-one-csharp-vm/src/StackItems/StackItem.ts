import { BN } from 'bn.js';
import { StackItemType } from './StackItemType';

export interface StackItemBase {
  readonly type: keyof typeof StackItemType;
  readonly isNull: boolean;
}

export interface AnyStackItem extends StackItemBase {
  readonly type: 'Any';
  readonly value: undefined;
}

export interface PointerStackItem extends StackItemBase {
  readonly type: 'Pointer';
  readonly value: Buffer;
  readonly position: number;
}

export interface BooleanStackItem extends StackItemBase {
  readonly type: 'Boolean';
  readonly value: boolean;
  readonly size: number;
}

export interface IntegerStackItem extends StackItemBase {
  readonly type: 'Integer';
  readonly value: BN;
  readonly size: number;
}

export interface ByteStringStackItem extends StackItemBase {
  readonly type: 'ByteString';
  readonly value: string;
  readonly size: number;
  readonly _buffer: Buffer;
}

export interface BufferStackItem extends StackItemBase {
  readonly type: 'Buffer';
  readonly value: Buffer;
  readonly size: number;
}

export interface ArrayStackItem extends StackItemBase {
  readonly type: 'Array';
  readonly value: readonly StackItem[];
  readonly count: number;
}

export interface StructStackItem extends StackItemBase {
  readonly type: 'Struct';
  readonly value: readonly StackItem[];
  readonly count: number;
}

export interface MapStackItem extends StackItemBase {
  readonly type: 'Map';
  readonly value: Map<PrimitiveStackItem, StackItem>;
  readonly count: number;
}

// tslint:disable-next-line: no-any TODO: need to investigate how this is typed
export interface InteropInterface<T = any> extends StackItemBase {
  readonly type: 'InteropInterface';
  readonly value: T;
}

export type PrimitiveStackItem = BooleanStackItem | IntegerStackItem | ByteStringStackItem;

export type StackItem =
  | AnyStackItem
  | PointerStackItem
  | PrimitiveStackItem
  | BufferStackItem
  | ArrayStackItem
  | StructStackItem
  | MapStackItem
  | InteropInterface;
