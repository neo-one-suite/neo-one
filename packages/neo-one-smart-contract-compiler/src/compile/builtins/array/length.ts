import { tsUtils } from '@neo-one/ts-utils';
import { DiagnosticCode } from '../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../DiagnosticMessage';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinBase, BuiltinMemberValue, BuiltinType, MemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ArrayLength extends BuiltinBase implements BuiltinMemberValue {
  public readonly types = new Set([BuiltinType.MemberValue]);

  public emitValue(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions, visited = false): void {
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
    sb.emitHelper(node, options, sb.helpers.arrayLength);
    // [val]
    sb.emitHelper(node, options, sb.helpers.createNumber);
  }
}
