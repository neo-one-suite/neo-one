import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import * as constants from '../../constants';
import { DiagnosticCode } from '../../DiagnosticCode';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ContinueStatementCompiler extends NodeCompiler<ts.ContinueStatement> {
  public readonly kind = ts.SyntaxKind.ContinueStatement;

  public visitNode(sb: ScriptBuilder, node: ts.ContinueStatement, options: VisitOptions): void {
    const label = tsUtils.statement.getLabel(node);
    if (label !== undefined) {
      sb.reportUnsupported(label);
    }

    if (options.continuePC === undefined) {
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
