import ts from 'typescript';
import { StructuredStorageSlots } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [struct, val]
// Output: [struct]
export class HandlePrefixArrayStructuredStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [struct, struct, val]
    sb.emitOp(node, 'DUP');
    // [number, struct, struct, val]
    sb.emitPushInt(node, StructuredStorageSlots.prefix);
    // [prefix, struct, val]
    sb.emitOp(node, 'PICKITEM');
    // [val, prefix, struct]
    sb.emitOp(node, 'ROT');
    // [val, prefix, val, struct]
    sb.emitOp(node, 'TUCK');
    // [buffer, prefix, val, struct]
    sb.emitHelper(node, options, sb.helpers.binarySerialize);
    // [prefix, val, struct]
    sb.emitOp(node, 'CAT');
    // [struct, prefix, val]
    sb.emitOp(node, 'ROT');
    // [struct, struct, prefix, val]
    sb.emitOp(node, 'DUP');
    // [number, struct, struct, prefix, val]
    sb.emitPushInt(node, StructuredStorageSlots.prefixArray);
    // [struct, number, struct, struct, prefix, val]
    sb.emitOp(node, 'OVER');
    // [number, struct, number, struct, struct, prefix, val]
    sb.emitPushInt(node, StructuredStorageSlots.prefixArray);
    // [array, number, struct, struct, prefix, val]
    sb.emitOp(node, 'PICKITEM');
    // [array, number, struct, struct, prefix, val]
    sb.emitHelper(node, options, sb.helpers.cloneArray);
    // [array, array, number, struct, struct, prefix, val]
    sb.emitOp(node, 'DUP');
    // [6, array, array, number, struct, struct, prefix, val]
    sb.emitPushInt(node, 6);
    // [val, array, array, number, struct, struct, prefix]
    sb.emitOp(node, 'ROLL');
    // [array, number, struct, struct, prefix]
    sb.emitOp(node, 'APPEND');
    // [struct, prefix]
    sb.emitOp(node, 'SETITEM');
    // [struct, prefix, struct]
    sb.emitOp(node, 'TUCK');
    // [number, struct, prefix, struct]
    sb.emitPushInt(node, StructuredStorageSlots.prefix);
    // [prefix, number, struct, struct]
    sb.emitOp(node, 'ROT');
    // [struct]
    sb.emitOp(node, 'SETITEM');
  }
}
