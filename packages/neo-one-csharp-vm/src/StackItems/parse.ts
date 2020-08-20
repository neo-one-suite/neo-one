import { PrimitiveStackItem, StackItem } from '@neo-one/csharp-core';
import { BN } from 'bn.js';
import { PrimitiveStackItemReturn, StackItemReturn } from './StackItemReturn';

export const parse = (stack: readonly StackItemReturn[]): readonly StackItem[] => stack.map(parseStackItem);

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
        value: parse(item.value),
        count: item.Count,
        isNull,
      };

    case 'Struct':
      return {
        type: 'Struct',
        value: parse(item.value), // TODO: how should StructStackItem look?
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
        value: item.value.toString('utf8'),
        _buffer: item.value,
        size: item.Size,
        isNull,
      };

    default:
      // TODO: create an error here
      throw new Error('Invalid StackItem');
  }
};
