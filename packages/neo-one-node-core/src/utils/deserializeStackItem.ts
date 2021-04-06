import { assertStackItemType, BinaryReader, InvalidFormatError, StackItemType } from '@neo-one/client-common';
import { BN } from 'bn.js';
import _ from 'lodash';
import {
  ArrayStackItem,
  assertPrimitiveStackItem,
  assertStackItem,
  BooleanStackItem,
  BufferStackItem,
  ByteStringStackItem,
  IntegerStackItem,
  MapStackItem,
  NullStackItem,
  PrimitiveStackItem,
  StackItem,
  StructStackItem,
} from '../StackItems';

interface ContainerPlaceholderAdd {
  readonly type: StackItemType;
  readonly elementCount: number;
}

class ContainerPlaceholder {
  public readonly type: StackItemType;
  public readonly elementCount: number;
  public readonly isContainerPlaceHolder = true;

  public constructor({ type, elementCount }: ContainerPlaceholderAdd) {
    this.type = type;
    this.elementCount = elementCount;
  }
}

// tslint:disable-next-line: no-any
const isContainerPlaceholder = (item: any): item is ContainerPlaceholder => item.isContainerPlaceHolder === true;

// tslint:disable: no-array-mutation no-loop-statement increment-decrement
export const deserializeStackItem = (reader: BinaryReader, maxArraySize: number, maxItemSize: number): StackItem => {
  const deserialized: Array<StackItem | ContainerPlaceholder> = [];
  let undeserialized = 1;
  while (undeserialized-- > 0) {
    const type = assertStackItemType(reader.readInt8());
    switch (type) {
      case StackItemType.Any:
        deserialized.unshift(new NullStackItem());
        break;

      case StackItemType.Boolean:
        deserialized.unshift(new BooleanStackItem(reader.readBoolean()));
        break;

      case StackItemType.Integer:
        deserialized.unshift(new IntegerStackItem(new BN(reader.readVarBytesLE(IntegerStackItem.maxSize), 'le')));
        break;

      case StackItemType.ByteString:
        deserialized.unshift(new ByteStringStackItem(reader.readVarBytesLE(maxItemSize)));
        break;

      case StackItemType.Buffer:
        deserialized.unshift(new BufferStackItem(reader.readVarBytesLE(maxItemSize)));
        break;

      case StackItemType.Array:
      case StackItemType.Struct:
        const structCount = reader.readVarUIntLE(maxArraySize).toNumber();
        deserialized.unshift(new ContainerPlaceholder({ type, elementCount: structCount }));
        undeserialized += structCount;
        break;

      case StackItemType.Map:
        const mapCount = reader.readVarUIntLE(maxArraySize).toNumber();
        deserialized.unshift(new ContainerPlaceholder({ type, elementCount: mapCount }));
        undeserialized += mapCount * 2;
        break;

      default:
        throw new InvalidFormatError(`Invalid StackItemType, found: ${type}`);
    }
  }

  let stackTemp: Array<StackItem | ContainerPlaceholder> = [];
  while (deserialized.length > 0) {
    const item = deserialized.shift();
    if (item === undefined) {
      throw new Error('Unexpected undefined since deserialized.length > 0');
    }
    // tslint:disable-next-line: no-any
    if (isContainerPlaceholder(item)) {
      switch (item.type) {
        case StackItemType.Array:
          const arrayElements = stackTemp.slice(0, item.elementCount).map(assertStackItem);
          stackTemp = stackTemp.slice(item.elementCount);
          stackTemp.unshift(new ArrayStackItem(arrayElements));
          break;

        case StackItemType.Struct:
          const structElements = stackTemp.slice(0, item.elementCount).map(assertStackItem);
          stackTemp = stackTemp.slice(item.elementCount);
          stackTemp.unshift(new StructStackItem(structElements));
          break;

        case StackItemType.Map:
          const mapElements = stackTemp.slice(0, item.elementCount * 2).map(assertStackItem);
          stackTemp = stackTemp.slice(item.elementCount * 2);
          stackTemp.unshift(
            new MapStackItem(
              _.range(0, item.elementCount * 2, 2).reduce((acc, idx) => {
                const key = assertPrimitiveStackItem(mapElements[idx]);
                acc.set(key, mapElements[idx + 1]);

                return acc;
              }, new Map<PrimitiveStackItem, StackItem>()),
            ),
          );
          break;

        default:
          throw new InvalidFormatError(`Invalid ContainerPlaceholder type, found: ${item.type}`);
      }
    } else {
      stackTemp.unshift(item);
    }
  }

  return assertStackItem(stackTemp[0]);
};
// tslint:enable: no-array-mutation no-loop-statement increment-decrement
