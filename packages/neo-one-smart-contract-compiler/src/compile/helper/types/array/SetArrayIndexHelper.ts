import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [val, indexNumber, arrayVal]
// Output: []
export class SetArrayIndexHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [arrayVal, val, indexNumber]
    sb.emitOp(node, 'ROT');
    // [arr, val, indexNumber]
    sb.emitHelper(node, options, sb.helpers.unwrapArray);
    // [arr, arr, val, indexNumber]
    sb.emitOp(node, 'DUP');
    // [indexNumber, val, arr, arr]
    sb.emitOp(node, 'REVERSE4');
    // [arr, val, indexNumber, arr]
    sb.emitOp(node, 'REVERSE3');
    // [2, arr, val, indexNumber, arr]
    sb.emitPushInt(node, 2);
    // [indexNumber, arr, val, indexNumber, arr]
    sb.emitOp(node, 'PICK');
    // [number, arr, val, indexNumber, arr]
    sb.emitOp(node, 'INC');
    // [val, indexNumber, arr]
    sb.emitHelper(node, options, sb.helpers.extendArr);
    // []
    sb.emitOp(node, 'SETITEM');
  }
}
