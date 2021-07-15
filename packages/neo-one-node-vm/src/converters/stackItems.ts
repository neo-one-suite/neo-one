import { Script, StackItemType } from '@neo-one/client-common';
import {
  ArrayStackItem,
  BooleanStackItem,
  BufferStackItem,
  ByteStringStackItem,
  IntegerStackItem,
  InteropInterface,
  MapStackItem,
  NullStackItem,
  PointerStackItem,
  PrimitiveStackItem,
  StackItem,
  StructStackItem,
} from '@neo-one/node-core';
import { BN } from 'bn.js';

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
  readonly value: string | number;
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
export interface InteropInterfaceStackItemReturn<T extends object = any> extends StackItemReturnBase {
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

export const parseStackItems = (stack: readonly StackItemReturn[]): readonly StackItem[] => stack.map(parseStackItem);

export const parseStackItem = (item: StackItemReturn): StackItem => {
  switch (item.Type) {
    case 'Any':
      return new NullStackItem();

    case 'Array':
      return new ArrayStackItem(parseStackItems(item.value));

    case 'Buffer':
      return new BufferStackItem(item.value);

    case 'InteropInterface':
      return new InteropInterface(item.value);

    case 'Map':
      return new MapStackItem(
        item.value.reduce((acc, { key, value }) => {
          const parsedKey = parsePrimitiveStackItem(key);
          const parsedValue = parseStackItem(value);

          acc.set(parsedKey, parsedValue);

          return acc;
        }, new Map<PrimitiveStackItem, StackItem>()),
      );

    case 'Pointer':
      return new PointerStackItem({
        script: new Script(item.value),
        position: item.Position,
      });

    case 'Struct':
      return new StructStackItem(parseStackItems(item.value));

    default:
      return parsePrimitiveStackItem(item);
  }
};

const parsePrimitiveStackItem = (item: PrimitiveStackItemReturn): PrimitiveStackItem => {
  switch (item.Type) {
    case 'Boolean':
      return new BooleanStackItem(item.value);

    case 'ByteString':
      return new ByteStringStackItem(item.value);

    case 'Integer':
      return new IntegerStackItem(new BN(item.value, 'le'));

    default:
      throw new Error(`invalid stack item when parsing, found type ${item}`);
  }
};
