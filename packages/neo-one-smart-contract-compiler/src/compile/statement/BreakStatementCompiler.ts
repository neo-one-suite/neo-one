import { BreakStatement, SyntaxKind } from 'ts-simple-ast';

import { DiagnosticCode } from '../../DiagnosticCode';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

import * as constants from '../../constants';

export class BreakStatementCompiler extends NodeCompiler<BreakStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.BreakStatement;

  public visitNode(sb: ScriptBuilder, node: BreakStatement, options: VisitOptions): void {
    const label = node.getLabel();
    if (label !== undefined) {
      sb.reportUnsupported(label);
    }

    if (options.breakPC === undefined) {
      sb.reportError(
        node,
        'Something went wrong. Expected a break jump location.',
        DiagnosticCode.SOMETHING_WENT_WRONG,
      );
    } else {
      sb.emitPushInt(node, constants.BREAK_COMPLETION);
      sb.emitJmp(node, 'JMP', options.breakPC);
    }
  }
}
