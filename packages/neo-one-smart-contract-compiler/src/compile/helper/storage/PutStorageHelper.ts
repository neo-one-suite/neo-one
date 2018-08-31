import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer, valBuffer]
// Output: []
export class PutStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, _optionsIn: VisitOptions): void {
    // [context, keyBuffer, valBuffer]
    sb.emitSysCall(node, 'Neo.Storage.GetContext');
    // []
    sb.emitSysCall(node, 'Neo.Storage.Put');
  }
}
