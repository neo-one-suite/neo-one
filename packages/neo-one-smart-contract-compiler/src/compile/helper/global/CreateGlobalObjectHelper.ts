import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [globalObject]
export class CreateGlobalObjectHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    // TODO: remove this section when fixing how we call contracts
    sb.emitHelper(
      node,
      optionsIn,
      sb.helpers.if({
        condition: () => {
          // [depth]
          sb.emitOp(node, 'DEPTH');
          // [notZero]
          sb.emitOp(node, 'NZ');
        },
        whenTrue: () => {
          // [length, method, ...args]
          sb.emitOp(node, 'DEPTH');
          // [...argsReversed, method]
          sb.emitOp(node, 'REVERSEN');
          // [length, ...argsReversed, method]
          sb.emitOp(node, 'DEPTH');
          // [length - 1, ...argsReversed, method]
          sb.emitOp(node, 'DEC');
          // [...args, method]
          sb.emitOp(node, 'REVERSEN');
          // [length, ...args, method]
          sb.emitOp(node, 'DEPTH');
          // [length - 1, ...args, method]
          sb.emitOp(node, 'DEC');
          // [[args], method]
          sb.emitOp(node, 'PACK');
          // [method, [args]]
          sb.emitOp(node, 'SWAP');
        },
      }),
    );
    // TODO: remove end
    // [length, ...args]
    sb.emitOp(node, 'DEPTH');
    // [argv]
    sb.emitOp(node, 'PACK');
    // [map, argv]
    sb.emitOp(node, 'NEWMAP');
    // [map, argv, map]
    sb.emitOp(node, 'TUCK');
    // [number, map, argv, map]
    sb.emitPushInt(node, GlobalProperty.Arguments);
    // [argv, number, map, map]
    sb.emitOp(node, 'ROT');
    // [map]
    sb.emitOp(node, 'SETITEM');
    // [map, map]
    sb.emitOp(node, 'DUP');
    // [number, map, map]
    sb.emitPushInt(node, GlobalProperty.Modules);
    // [arr, number, map, map]
    sb.emitOp(node, 'NEWARRAY0');
    // [map]
    sb.emitOp(node, 'SETITEM');
    // [map, map]
    sb.emitOp(node, 'DUP');
    // [number, map, map]
    sb.emitPushInt(node, GlobalProperty.CallingScriptHash);
    // [buffer, number, map, map]
    sb.emitSysCall(node, 'System.Runtime.GetCallingScriptHash');
    // [map]
    sb.emitOp(node, 'SETITEM');

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
