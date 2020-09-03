import { StackItemType } from '@neo-one/node-core';

export interface StackItemReturnBase {
  readonly Type: keyof typeof StackItemType;
  readonly IsNull: boolean;
}

export interface AnyStackItemReturn extends StackItemReturnBase {
  readonly Type: 'Any';
}

export interface PointerStackItemReturn extends StackItemReturnBase {
  readonly Type: 'Pointer';
  readonly value: Buffer;
  readonly Position: number;
}

export interface BooleanStackItemReturn extends StackItemReturnBase {
  readonly Type: 'Boolean';
  readonly value: boolean;
  readonly Size: number;
}

export interface IntegerStackItemReturn extends StackItemReturnBase {
  readonly Type: 'Integer';
  readonly value: string | number; // TODO: it might just be one?
  readonly Size: number;
}

export interface ByteStringStackItemReturn extends StackItemReturnBase {
  readonly Type: 'ByteString';
  readonly value: Buffer;
  readonly Size: number;
}

export interface BufferStackItemReturn extends StackItemReturnBase {
  readonly Type: 'Buffer';
  readonly value: Buffer;
  readonly Size: number;
}

export interface ArrayStackItemReturn extends StackItemReturnBase {
  readonly Type: 'Array';
  readonly value: readonly StackItemReturn[];
  readonly Count: number;
}

export interface StructStackItemReturn extends StackItemReturnBase {
  readonly Type: 'Struct';
  readonly value: readonly StackItemReturn[];
  readonly Count: number;
}

export interface MapStackItemReturn extends StackItemReturnBase {
  readonly Type: 'Map';
  readonly value: ReadonlyArray<{ readonly key: PrimitiveStackItemReturn; readonly value: StackItemReturn }>;
  readonly Count: number;
}

// tslint:disable-next-line: no-any
export interface InteropInterfaceStackItemReturn<T = any> extends StackItemReturnBase {
  readonly Type: 'InteropInterface';
  readonly value: T;
}

export type PrimitiveStackItemReturn = BooleanStackItemReturn | IntegerStackItemReturn | ByteStringStackItemReturn;

export type StackItemReturn =
  | PrimitiveStackItemReturn
  | AnyStackItemReturn
  | PointerStackItemReturn
  | BufferStackItemReturn
  | ArrayStackItemReturn
  | StructStackItemReturn
  | MapStackItemReturn
  | InteropInterfaceStackItemReturn;
