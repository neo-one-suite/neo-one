import { Node, ts } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

export enum SerializableType {
  Array = 7,
  Buffer = 8,
}

const invokeGlobal = (
  sb: ScriptBuilder,
  node: Node<ts.Node>,
  options: VisitOptions,
  name: string,
) => {
  // [1, val]
  sb.emitPushInt(node, 1);
  // [argsarr]
  sb.emitOp(node, 'PACK');
  // [globalObjectVal, argsarr]
  sb.scope.getGlobal(sb, node, options);
  // [name, globalObjectVal, argsarr]
  sb.emitPushString(node, name);
  // [objectVal, argsarr]
  sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
  // [val]
  sb.emitHelper(node, options, sb.helpers.invokeCall());
};

export const SERIALIZE_NAME = 'genericSerialize';

export const invokeSerialize = (
  sb: ScriptBuilder,
  node: Node<ts.Node>,
  options: VisitOptions,
) => invokeGlobal(sb, node, options, SERIALIZE_NAME);

export const DESERIALIZE_NAME = 'genericDeserialize';

export const invokeDeserialize = (
  sb: ScriptBuilder,
  node: Node<ts.Node>,
  options: VisitOptions,
) => invokeGlobal(sb, node, options, DESERIALIZE_NAME);

export const serializeType = (
  sb: ScriptBuilder,
  node: Node<ts.Node>,
  options: VisitOptions,
  type: SerializableType,
) => {
  // [type, arr]
  sb.emitPushInt(node, type);
  // [2, type, arr]
  sb.emitPushInt(node, 2);
  // [arr]
  sb.emitOp(node, 'PACK');
};

export const deserializeType = (
  sb: ScriptBuilder,
  node: Node<ts.Node>,
  options: VisitOptions,
) => {
  // [1, arr]
  sb.emitPushInt(node, 1);
  // [value]
  sb.emitOp(node, 'PICKITEM');
};

const isSerializedType = (
  sb: ScriptBuilder,
  node: Node<ts.Node>,
  options: VisitOptions,
  type: SerializableType,
) => {
  // [0, val]
  sb.emitPushInt(node, 0);
  // [type]
  sb.emitOp(node, 'PICKITEM');
  // [type, type]
  sb.emitPushInt(node, type);
  // [isSerializedType]
  sb.emitOp(node, 'NUMEQUAL');
};

export const getTypes = (
  sb: ScriptBuilder,
  node: Node<ts.Node>,
  options: VisitOptions,
) => [
  {
    isRuntimeType: () => {
      // [isBoolean]
      sb.emitHelper(node, options, sb.helpers.isBoolean);
    },
    serialize: () => {
      // do nothing
    },
    isSerializedType: () => {
      // [isBoolean]
      sb.emitHelper(node, options, sb.helpers.isBoolean);
    },
    deserialize: () => {
      // do nothing
    },
  },
  {
    isRuntimeType: () => {
      // [isString]
      sb.emitHelper(node, options, sb.helpers.isString);
    },
    serialize: () => {
      // do nothing
    },
    isSerializedType: () => {
      // [isString]
      sb.emitHelper(node, options, sb.helpers.isString);
    },
    deserialize: () => {
      // do nothing
    },
  },
  {
    isRuntimeType: () => {
      // [isNumber]
      sb.emitHelper(node, options, sb.helpers.isNumber);
    },
    serialize: () => {
      // do nothing
    },
    isSerializedType: () => {
      // [isNumber]
      sb.emitHelper(node, options, sb.helpers.isNumber);
    },
    deserialize: () => {
      // do nothing
    },
  },
  {
    isRuntimeType: () => {
      // [Array, val]
      sb.emitHelper(
        node,
        options,
        sb.helpers.getGlobalProperty({ property: 'Buffer' }),
      );
      // [val instanceof Array]
      sb.emitHelper(node, options, sb.helpers.instanceof);
    },
    serialize: () => {
      // [bytearray]
      sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
      // [arr]
      serializeType(sb, node, options, SerializableType.Buffer);
    },
    isSerializedType: () => {
      isSerializedType(sb, node, options, SerializableType.Buffer);
    },
    deserialize: () => {
      deserializeType(sb, node, options);
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    },
  },
  {
    isRuntimeType: () => {
      // [Array, val]
      sb.emitHelper(
        node,
        options,
        sb.helpers.getGlobalProperty({ property: 'Array' }),
      );
      // [val instanceof Array]
      sb.emitHelper(node, options, sb.helpers.instanceof);
    },
    serialize: () => {
      // [arr]
      sb.emitHelper(node, options, sb.helpers.unwrapArray);
      // [arr]
      sb.emitHelper(
        node,
        options,
        sb.helpers.arrMap({
          map: () => {
            invokeSerialize(sb, node, options);
          },
        }),
      );
      // [value]
      serializeType(sb, node, options, SerializableType.Array);
    },
    isSerializedType: () => {
      isSerializedType(sb, node, options, SerializableType.Array);
    },
    deserialize: () => {
      // [arr]
      deserializeType(sb, node, options);
      // [arr]
      sb.emitHelper(
        node,
        options,
        sb.helpers.arrMap({
          map: () => {
            invokeDeserialize(sb, node, options);
          },
        }),
      );
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapArray);
    },
  },
];
