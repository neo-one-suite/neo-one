import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInType, BuiltInValue } from '../types';

export class ErrorInstance extends BuiltInBase implements BuiltInValue {
  public readonly canImplement = true;
  public readonly types = new Set([BuiltInType.Value]);

  public emitValue(sb: ScriptBuilder, node: ts.Identifier, options: VisitOptions): void {
    // [classVal]
    sb.emitHelper(node, options, sb.helpers.getErrorClass);
  }
}
export class ErrorType extends BuiltInBase {}
