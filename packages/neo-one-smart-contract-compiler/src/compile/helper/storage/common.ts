import ts from 'typescript';
import { InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

export const createGetKey = (sb: ScriptBuilder, node: ts.Node) => (innerOptions: VisitOptions) => {
  // [buffer]
  sb.emitSysCall(node, 'Neo.Runtime.Serialize');
  // [thisObjectVal, buffer]
  sb.scope.getThis(sb, node, innerOptions);
  // [number, thisObjectVal, buffer]
  sb.emitPushInt(node, InternalObjectProperty.Data0);
  // [prefix, buffer]
  sb.emitHelper(node, innerOptions, sb.helpers.getInternalObjectProperty);
  // [buffer, prefix]
  sb.emitOp(node, 'SWAP');
  // [prefix + buffer]
  sb.emitOp(node, 'CAT');
};

type Emit = (options: VisitOptions) => void;

export const createConstructor = (sb: ScriptBuilder, node: ts.Node) => (innerOptionsIn: VisitOptions) => {
  const innerOptions = sb.pushValueOptions(innerOptionsIn);
  // [val]
  sb.emitHelper(
    node,
    innerOptions,
    sb.helpers.if({
      condition: () => {
        // [argsarr, argsarr]
        sb.emitOp(node, 'DUP');
        // [number, argsarr]
        sb.emitOp(node, 'ARRAYSIZE');
        // [number, number, argsarr]
        sb.emitPushInt(node, 0);
        // [boolean, argsarr]
        sb.emitOp(node, 'NUMEQUAL');
      },
      whenTrue: () => {
        // []
        sb.emitOp(node, 'DROP');
        // [buffer]
        sb.emitPushBuffer(node, Buffer.from([]));
      },
      whenFalse: () => {
        // [number, argsarr]
        sb.emitPushInt(node, 0);
        // [val]
        sb.emitOp(node, 'PICKITEM');
        // [buffer]
        sb.emitHelper(node, innerOptions, sb.helpers.unwrapBuffer);
      },
    }),
  );
  // [objectVal, buffer]
  sb.scope.getThis(sb, node, innerOptions);
  // [number, objectVal, buffer]
  sb.emitPushInt(node, InternalObjectProperty.Data0);
  // [buffer, number, objectVal]
  sb.emitOp(node, 'ROT');
  // []
  sb.emitHelper(node, innerOptions, sb.helpers.setInternalObjectProperty);
};

export const createGet = (sb: ScriptBuilder, node: ts.Node, getKey: Emit, handleMissing: Emit) => (
  innerOptions: VisitOptions,
) => {
  // [number, argsarr]
  sb.emitPushInt(node, 0);
  // [val]
  sb.emitOp(node, 'PICKITEM');
  // [buffer]
  getKey(innerOptions);
  // [buffer]
  sb.emitHelper(node, innerOptions, sb.helpers.getStorage);
  sb.emitHelper(
    node,
    innerOptions,
    sb.helpers.handleUndefinedStorage({
      handleUndefined: () => {
        handleMissing(innerOptions);
      },
      handleDefined: () => {
        sb.emitSysCall(node, 'Neo.Runtime.Deserialize');
      },
    }),
  );
};

export const createSet = (sb: ScriptBuilder, node: ts.Node, getKey: Emit, handleValue: Emit) => (
  innerOptions: VisitOptions,
) => {
  // [argsarr, argsarr]
  sb.emitOp(node, 'DUP');
  // [number, argsarr, argsarr]
  sb.emitPushInt(node, 0);
  // [val, argsarr]
  sb.emitOp(node, 'PICKITEM');
  // [buffer, argsarr]
  getKey(innerOptions);
  // [val, bufferKey]
  handleValue(innerOptions);
  // [bufferVal, bufferKey]
  sb.emitSysCall(node, 'Neo.Runtime.Serialize');
  // [bufferKey, bufferVal]
  sb.emitOp(node, 'SWAP');
  // []
  sb.emitHelper(node, innerOptions, sb.helpers.putStorage);
  // [val]
  sb.emitHelper(node, innerOptions, sb.helpers.wrapUndefined);
};

export const createDelete = (sb: ScriptBuilder, node: ts.Node, getKey: Emit) => (innerOptions: VisitOptions) => {
  // [number, argsarr]
  sb.emitPushInt(node, 0);
  // [val]
  sb.emitOp(node, 'PICKITEM');
  // [buffer]
  getKey(innerOptions);
  sb.emitHelper(
    node,
    innerOptions,
    sb.helpers.if({
      condition: () => {
        // [boolean, buffer]
        sb.emitHelper(node, innerOptions, sb.helpers.deleteStorage);
      },
      whenTrue: () => {
        // [boolean]
        sb.emitPushBoolean(node, true);
      },
      whenFalse: () => {
        // [boolean]
        sb.emitPushBoolean(node, false);
      },
    }),
  );
  // [val]
  sb.emitHelper(node, innerOptions, sb.helpers.wrapBoolean);
};
