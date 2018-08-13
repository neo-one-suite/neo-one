import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer]
// Output: [value]
export class GetStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    // [context, keyBuffer]
    sb.emitSysCall(node, 'Neo.Storage.GetReadOnlyContext');
    // [value]
    sb.emitSysCall(node, 'Neo.Storage.Get');

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
