import ts from 'typescript';
import { DiagnosticCode } from '../../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../../DiagnosticMessage';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinMemberCall } from '../../BuiltinMemberCall';
import { MemberLikeExpression } from '../../types';

// tslint:disable-next-line export-name
export class Hash160From extends BuiltinMemberCall {
  public emitCall(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    options: VisitOptions,
  ): void {
    const scriptHash = sb.context.analysis.extractLiteralHash160(node);
    if (scriptHash === undefined) {
      sb.context.reportError(node, DiagnosticCode.InvalidLiteral, DiagnosticMessage.InvalidHash160);

      return;
    }

    // [buffer]
    sb.emitPushBuffer(node, scriptHash);
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapBuffer);
  }
}
