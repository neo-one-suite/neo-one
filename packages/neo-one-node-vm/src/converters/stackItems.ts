import { PrimitiveStackItem, StackItem, StackItemType } from '@neo-one/node-core';
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

export const parseStackItems = (stack: readonly StackItemReturn[]): readonly StackItem[] => stack.map(parseStackItem);

const parseStackItem = (item: StackItemReturn): StackItem => {
  const isNull = item.IsNull;
  switch (item.Type) {
    case 'Any':
      return {
        type: 'Any',
        value: undefined,
        isNull,
      };

    case 'Pointer':
      return {
        type: 'Pointer',
        value: item.value,
        position: item.Position,
        isNull,
      };

    case 'Buffer':
      return {
        type: 'Buffer',
        value: item.value,
        size: item.Size,
        isNull,
      };

    case 'Array':
      return {
        type: 'Array',
        value: parseStackItems(item.value),
        count: item.Count,
        isNull,
      };

    case 'Struct':
      return {
        type: 'Struct',
        value: parseStackItems(item.value), // TODO: how should StructStackItem look?
        count: item.Count,
        isNull,
      };

    case 'Map':
      return {
        type: 'Map',
        value: item.value.reduce((acc, { key, value }) => {
          acc.set(parsePrimitiveStackItem(key), parseStackItem(value));

          return acc;
        }, new Map<PrimitiveStackItem, StackItem>()),
        count: item.Count,
        isNull,
      };

    case 'InteropInterface':
      return {
        type: 'InteropInterface',
        value: item.value,
        isNull,
      };

    default:
      return parsePrimitiveStackItem(item);
  }
};

const parsePrimitiveStackItem = (item: PrimitiveStackItemReturn): PrimitiveStackItem => {
  const isNull = item.IsNull;
  switch (item.Type) {
    case 'Boolean':
      return {
        type: 'Boolean',
        value: item.value,
        size: item.Size,
        isNull,
      };

    case 'Integer':
      return {
        type: 'Integer',
        value: new BN(item.value),
        size: item.Size,
        isNull,
      };

    case 'ByteString':
      return {
        type: 'ByteString',
        value: item.value,
        asString: () => item.value.toString('utf8'),
        size: item.Size,
        isNull,
      };

    default:
      // TODO: create an error here
      throw new Error('Invalid StackItem');
  }
};
