import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import * as constants from '../../constants';
import { DiagnosticCode } from '../../DiagnosticCode';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class BreakStatementCompiler extends NodeCompiler<ts.BreakStatement> {
  public readonly kind = ts.SyntaxKind.BreakStatement;

  public visitNode(sb: ScriptBuilder, node: ts.BreakStatement, options: VisitOptions): void {
    const label = tsUtils.statement.getLabel(node);
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
