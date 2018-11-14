import ts from 'typescript';
import { StructuredStorageSlots } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [idx, val]
// Output: []
export class PutArrayStorageLengthHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [val, idx]
    sb.emitOp(node, 'SWAP');
    // [prefix, idx]
    sb.emitHelper(node, options, sb.helpers.unwrapArrayStorage);
    // [number, map]
    sb.emitPushInt(node, StructuredStorageSlots.prefix);
    // [prefix]
    sb.emitOp(node, 'PICKITEM');
    // [idx]
    sb.emitHelper(node, options, sb.helpers.putCommonStorage);
  }
}
