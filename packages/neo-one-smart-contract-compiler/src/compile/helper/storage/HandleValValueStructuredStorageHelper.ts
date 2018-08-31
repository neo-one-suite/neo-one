import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [iterator]
// Output: [val]
export class HandleValValueStructuredStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [value]
    sb.emitSysCall(node, 'Neo.Enumerator.Value');
    // [arr]
    sb.emitSysCall(node, 'Neo.Runtime.Deserialize');
    // [1, arr]
    sb.emitPushInt(node, 1);
    // [val]
    sb.emitOp(node, 'PICKITEM');
  }
}
