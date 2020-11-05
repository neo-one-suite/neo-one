import { InvalidFormatError, JSONHelper, PrimitiveStackItemJSON, StackItemJSON } from '@neo-one/client-common';
import { InvalidPrimitiveStackItemError, InvalidStackItemError, InvalidStackItemTypeError } from '../errors';
import { ArrayStackItem } from './ArrayStackItem';
import { BooleanStackItem } from './BooleanStackItem';
import { BufferStackItem } from './BufferStackItem';
import { ByteStringStackItem } from './ByteStringStackItem';
import { IntegerStackItem } from './IntegerStackItem';
import { InteropInterface } from './InteropInterface';
import { MapStackItem } from './MapStackItem';
import { NullStackItem } from './NullStackItem';
import { PointerStackItem } from './PointerStackItem';
import { isStackItemType, StackItemType } from './StackItemType';
import { StructStackItem } from './StructStackItem';

export type PrimitiveStackItem = BooleanStackItem | IntegerStackItem | ByteStringStackItem;

export type StackItem =
  | ArrayStackItem
  | BufferStackItem
  | InteropInterface
  | MapStackItem
  | NullStackItem
  | PointerStackItem
  | StructStackItem
  | PrimitiveStackItem;

// tslint:disable no-any
export const isStackItem = (item: any): item is StackItem => {
  if (item !== undefined && item.type !== undefined && isStackItemType(item.type)) {
    // tslint:disable-next-line strict-type-predicates
    return StackItemType[item.type] !== undefined;
  }

  return false;
};

export const assertStackItem = (item: any): StackItem => {
  if (isStackItem(item)) {
    return item;
  }

  throw new InvalidStackItemError();
};

export const getIsStackItemType = <T>(type: StackItemType) => (item: any): item is T => {
  if (isStackItem(item)) {
    return item.type === type;
  }

  return false;
};

export const getAssertStackItemType = <T>(isFunc: (item: any) => item is T, type: StackItemType) => (item: any) => {
  if (isFunc(item)) {
    return item;
  }

  throw new InvalidStackItemTypeError(StackItemType[type], item.type);
};

export const isNullStackItem: (item: any) => item is NullStackItem = getIsStackItemType(StackItemType.Any);
export const isPointerStackItem: (item: any) => item is PointerStackItem = getIsStackItemType(StackItemType.Pointer);
export const isBooleanStackItem: (item: any) => item is BooleanStackItem = getIsStackItemType(StackItemType.Boolean);
export const isIntegerStackItem: (item: any) => item is IntegerStackItem = getIsStackItemType(StackItemType.Integer);
export const isByteStringStackItem: (item: any) => item is ByteStringStackItem = getIsStackItemType(
  StackItemType.ByteString,
);
export const isBufferStackItem: (item: any) => item is BufferStackItem = getIsStackItemType(StackItemType.Buffer);
export const isArrayStackItem: (item: any) => item is ArrayStackItem = getIsStackItemType(StackItemType.Array);
export const isStructStackItem: (item: any) => item is StructStackItem = getIsStackItemType(StackItemType.Struct);
export const isMapStackItem: (item: any) => item is MapStackItem = getIsStackItemType(StackItemType.Map);
export const isInteropInterface: (item: any) => item is InteropInterface = getIsStackItemType(
  StackItemType.InteropInterface,
);
export const isArrayLikeStackItem = (item: any): item is ArrayStackItem | StructStackItem =>
  isArrayStackItem(item) || isStructStackItem(item);
export const isPrimitiveStackItem = (item: any): item is PrimitiveStackItem =>
  isBooleanStackItem(item) || isByteStringStackItem(item) || isIntegerStackItem(item);

export const assertAnyStackItem: (item: any) => NullStackItem = getAssertStackItemType(
  isNullStackItem,
  StackItemType.Any,
);
export const assertPointerStackItem: (item: any) => PointerStackItem = getAssertStackItemType(
  isPointerStackItem,
  StackItemType.Pointer,
);
export const assertBooleanStackItem: (item: any) => BooleanStackItem = getAssertStackItemType(
  isBooleanStackItem,
  StackItemType.Boolean,
);
export const assertIntegerStackItem: (item: any) => IntegerStackItem = getAssertStackItemType(
  isIntegerStackItem,
  StackItemType.Integer,
);
export const assertByteStringStackItem: (item: any) => ByteStringStackItem = getAssertStackItemType(
  isByteStringStackItem,
  StackItemType.ByteString,
);
export const assertBufferStackItem: (item: any) => BufferStackItem = getAssertStackItemType(
  isBufferStackItem,
  StackItemType.Buffer,
);
export const assertArrayStackItem: (item: any) => ArrayStackItem = getAssertStackItemType(
  isArrayStackItem,
  StackItemType.Array,
);
export const assertStructStackItem: (item: any) => StructStackItem = getAssertStackItemType(
  isStructStackItem,
  StackItemType.Struct,
);
export const assertArrayLikeStackItem = (item: any) => {
  if (isArrayLikeStackItem(item)) {
    return item;
  }

  throw new InvalidStackItemTypeError('ArrayLikeStackItem', item.type);
};
export const assertMapStackItem: (item: any) => MapStackItem = getAssertStackItemType(
  isMapStackItem,
  StackItemType.Map,
);
export const assertInteropInterfaceStackItem: (item: any) => InteropInterface = getAssertStackItemType(
  isInteropInterface,
  StackItemType.InteropInterface,
);
export const assertPrimitiveStackItem = (item: any): PrimitiveStackItem => {
  if (isPrimitiveStackItem(item)) {
    return item;
  }

  throw new InvalidPrimitiveStackItemError();
};

export const stackItemToJSON = (item: StackItem, context?: Set<StackItem>): StackItemJSON => {
  switch (item.type) {
    case StackItemType.Array:
      const array = assertArrayStackItem(item);
      const arrayContext = context ?? new Set<StackItem>();
      if (arrayContext.has(array)) {
        throw new InvalidFormatError();
      }
      arrayContext.add(array);

      return { type: 'Array', value: array.array.map((subItem) => stackItemToJSON(subItem, arrayContext)) };

    case StackItemType.Boolean:
      const booleanItem = assertBooleanStackItem(item);

      return { type: 'Boolean', value: booleanItem.getBoolean() };

    case StackItemType.Buffer:
      const buffer = assertBufferStackItem(item);

      return { type: 'Buffer', value: JSONHelper.writeBase64Buffer(buffer.getBuffer()) };

    case StackItemType.ByteString:
      const byteString = assertByteStringStackItem(item);

      return { type: 'ByteString', value: JSONHelper.writeBase64Buffer(byteString.getBuffer()) };

    case StackItemType.Integer:
      const integer = assertIntegerStackItem(item);

      return { type: 'Integer', value: integer.getInteger().toString() };

    case StackItemType.Map:
      const map = assertMapStackItem(item);
      const mapContext = context ?? new Set<StackItem>();
      if (mapContext.has(map)) {
        throw new InvalidFormatError();
      }
      mapContext.add(map);

      return {
        type: 'Map',
        value: Array.from(map.dictionary.entries()).map(([key, value]) => ({
          key: stackItemToJSON(key, mapContext) as PrimitiveStackItemJSON,
          value: stackItemToJSON(value, mapContext),
        })),
      };

    case StackItemType.Pointer:
      const pointer = assertPointerStackItem(item);

      return { type: 'Pointer', value: pointer.position };

    default:
      return { type: 'Any', value: undefined };
  }
};
