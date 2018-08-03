import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInType, BuiltInValue } from '../types';

// tslint:disable-next-line export-name
export class SymbolIterator extends BuiltInBase implements BuiltInValue {
  public readonly types = new Set([BuiltInType.Value]);
  public emitValue(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [string]
    sb.emitPushString(node, 'iterator');
    // [symbolVal]
    sb.emitHelper(node, options, sb.helpers.createSymbol);
  }
}
