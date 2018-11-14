import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
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
  protected readonly isReadonly: boolean = true;

  public emitValue(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions, visited = false): void {
    if (!this.canSet && options.setValue) {
      if (!this.isReadonly) {
        /* istanbul ignore next */
        sb.context.reportError(node, DiagnosticCode.InvalidBuiltinModify, DiagnosticMessage.CannotModifyBuiltin);
      }

      return;
    }

    if (!visited && (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))) {
      // [val]
      sb.visit(tsUtils.expression.getExpression(node), sb.pushValueOptions(options));
    }

    if (!this.canSet && !options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [val]
    this.emit(sb, node, options);
  }

  protected abstract emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void;
}
