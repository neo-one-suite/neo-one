import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer]
// Output: [iterator]
export class IterStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, _optionsIn: VisitOptions): void {
    // [context, keyBuffer]
    sb.emitSysCall(node, 'Neo.Storage.GetReadOnlyContext');
    // [iterator]
    sb.emitSysCall(node, 'Neo.Storage.Find');
  }
}
