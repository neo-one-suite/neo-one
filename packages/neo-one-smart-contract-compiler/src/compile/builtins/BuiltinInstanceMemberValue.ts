import { tsUtils } from '@neo-one/ts-utils';
import { DiagnosticCode } from '../../DiagnosticCode';
import { DiagnosticMessage } from '../../DiagnosticMessage';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import {
  BuiltinInstanceMemberValue as BuiltinInstanceMemberValueType,
  BuiltinType,
  MemberLikeExpression,
} from './types';

export abstract class BuiltinInstanceMemberValue implements BuiltinInstanceMemberValueType {
  public readonly types = new Set([BuiltinType.InstanceMemberValue]);
  protected readonly canSet: boolean = false;

  public emitValue(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions, visited = false): void {
    if (!this.canSet && options.setValue) {
      sb.context.reportError(node, DiagnosticCode.InvalidBuiltinModify, DiagnosticMessage.CannotModifyBuiltin);

      return;
    }

    if (!visited) {
      // [val]
      sb.visit(tsUtils.expression.getExpression(node), sb.pushValueOptions(options));
    }

    if (!this.canSet && !options.pushValue) {
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');

      return;
    }

    // [val]
    this.emit(sb, node, options);
  }

  protected abstract emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void;
}
