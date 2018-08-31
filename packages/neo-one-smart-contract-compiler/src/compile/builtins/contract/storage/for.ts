import ts from 'typescript';
import { DiagnosticCode } from '../../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../../DiagnosticMessage';
import { WrappableType } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinMemberCall } from '../../BuiltinMemberCall';
import { MemberLikeExpression } from '../../types';

// tslint:disable-next-line export-name
export class StorageFor extends BuiltinMemberCall {
  public constructor(private readonly type: WrappableType) {
    super();
  }

  public emitCall(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
  ): void {
    const prefix = sb.context.analysis.extractStorageKey(node);
    if (prefix === undefined) {
      sb.context.reportError(
        node,
        DiagnosticCode.InvalidStructuredStorageFor,
        DiagnosticMessage.InvalidStructuredStorageForProperty,
      );

      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    // [val]
    sb.emitHelper(node, options, sb.helpers.createStructuredStorage({ type: this.type, prefix }));
  }
}
