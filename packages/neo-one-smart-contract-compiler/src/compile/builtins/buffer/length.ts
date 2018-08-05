import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../DiagnosticMessage';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInMemberValue, BuiltInType } from '../types';

// tslint:disable-next-line export-name
export class BufferLength extends BuiltInBase implements BuiltInMemberValue {
  public readonly types = new Set([BuiltInType.MemberValue]);

  public emitValue(
    sb: ScriptBuilder,
    node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
    options: VisitOptions,
    visited = false,
  ): void {
    if (options.setValue) {
      sb.reportError(node, DiagnosticCode.InvalidBuiltinModify, DiagnosticMessage.CannotModifyBuiltin);

      return;
    }

    if (!options.pushValue) {
      if (visited) {
        /* istanbul ignore next */
        sb.emitOp(node, 'DROP');
      }

      return;
    }

    if (!visited) {
      // [arrayVal]
      sb.visit(tsUtils.expression.getExpression(node), options);
    }
    // [number]
    sb.emitHelper(node, options, sb.helpers.bufferLength);
    // [val]
    sb.emitHelper(node, options, sb.helpers.createNumber);
  }
}
