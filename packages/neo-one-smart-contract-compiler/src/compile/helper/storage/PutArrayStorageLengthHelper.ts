import ts from 'typescript';
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
    // [buffer, idx]
    sb.emitSysCall(node, 'Neo.Runtime.Serialize');
    // [idx]
    sb.emitHelper(node, options, sb.helpers.putCommonStorage);
  }
}
