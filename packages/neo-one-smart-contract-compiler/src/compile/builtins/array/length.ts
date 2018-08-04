import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../../DiagnosticCode';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInMemberValue, BuiltInType } from '../types';

// tslint:disable-next-line export-name
export class ArrayLength extends BuiltInBase implements BuiltInMemberValue {
  public readonly types = new Set([BuiltInType.MemberValue]);

  public emitValue(
    sb: ScriptBuilder,
    node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
    options: VisitOptions,
    visited = false,
  ): void {
    if (options.setValue) {
      sb.reportError(node, 'Cannot set array length', DiagnosticCode.CANNOT_SET_BUILTIN);

      return;
    }

    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    if (!visited) {
      // [arrayVal]
      sb.visit(tsUtils.expression.getExpression(node), options);
    }
    // [number]
    sb.emitHelper(node, options, sb.helpers.arrayLength);
    // [val]
    sb.emitHelper(node, options, sb.helpers.createNumber);
  }
}
