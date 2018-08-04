import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [globalObject]
export class CreateGlobalObjectHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
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
    // [number, number, map, map]
    sb.emitPushInt(node, 0);
    // [arr, number, map, map]
    sb.emitOp(node, 'NEWARRAY');
    // [map]
    sb.emitOp(node, 'SETITEM');

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
