import ts from 'typescript';
import { DiagnosticCode } from '../../DiagnosticCode';
import { DiagnosticMessage } from '../../DiagnosticMessage';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinType, BuiltinValue as BuiltinValueType } from './types';

export abstract class BuiltinValue implements BuiltinValueType {
  public readonly types = new Set([BuiltinType.Value]);

  public emitValue(sb: ScriptBuilder, node: ts.Identifier, options: VisitOptions): void {
    if (options.setValue) {
      /* istanbul ignore next */
      sb.context.reportError(node, DiagnosticCode.InvalidBuiltinModify, DiagnosticMessage.CannotModifyBuiltin);

      /* istanbul ignore next */
      return;
    }

    // [val]
    this.emit(sb, node, options);
  }

  protected abstract emit(sb: ScriptBuilder, node: ts.Identifier, options: VisitOptions): void;
}
