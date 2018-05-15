import { ContinueStatement, SyntaxKind } from 'ts-simple-ast';

import { DiagnosticCode } from '../../DiagnosticCode';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

import * as constants from '../../constants';

export class ContinueStatementCompiler extends NodeCompiler<ContinueStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.ContinueStatement;

  public visitNode(
    sb: ScriptBuilder,
    node: ContinueStatement,
    options: VisitOptions,
  ): void {
    const label = node.getLabel();
    if (label != null) {
      sb.reportUnsupported(label);
    }

    if (options.continuePC == null) {
      sb.reportError(
        node,
        'Something went wrong. Expected a continue jump location.',
        DiagnosticCode.SOMETHING_WENT_WRONG,
      );
    } else {
      sb.emitPushInt(node, constants.CONTINUE_COMPLETION);
      sb.emitJmp(node, 'JMP', options.continuePC);
    }
  }
}
