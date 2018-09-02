import { DiagnosticCode } from '../../DiagnosticCode';
import { DiagnosticMessage } from '../../DiagnosticMessage';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinMemberValue as BuiltinMemberValueType, BuiltinType, MemberLikeExpression } from './types';

export abstract class BuiltinMemberValue implements BuiltinMemberValueType {
  public readonly types = new Set([BuiltinType.MemberValue]);
  protected readonly canSet: boolean = false;
  protected readonly isReadonly: boolean = true;

  public emitValue(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    if (!this.canSet && options.setValue) {
      if (!this.isReadonly) {
        /* istanbul ignore next */
        sb.context.reportError(node, DiagnosticCode.InvalidBuiltinModify, DiagnosticMessage.CannotModifyBuiltin);
      }

      return;
    }

    // [val]
    this.emit(sb, node, options);
  }

  protected abstract emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void;
}
