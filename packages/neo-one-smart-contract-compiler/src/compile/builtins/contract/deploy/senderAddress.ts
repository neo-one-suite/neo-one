import { DiagnosticCode } from '../../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../../DiagnosticMessage';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinMemberValue } from '../../BuiltinMemberValue';
import { MemberLikeExpression } from '../../types';
import { isConstructorParameterDefault } from './isConstructorParameterDefault';

// tslint:disable-next-line export-name
export class DeploySenderAddress extends BuiltinMemberValue {
  protected emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    if (!isConstructorParameterDefault(node)) {
      sb.context.reportError(
        node,
        DiagnosticCode.InvalidSenderAddress,
        DiagnosticMessage.InvalidSenderAddressParameterUsage,
      );
    }

    if (options.pushValue) {
      // [buffer]
      sb.emitPushBuffer(node, Buffer.alloc(20, 0));
      // [bufferVal]
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    }
  }
}
