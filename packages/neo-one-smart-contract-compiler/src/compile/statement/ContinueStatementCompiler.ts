import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ContinueStatementCompiler extends NodeCompiler<ts.ContinueStatement> {
  public readonly kind = ts.SyntaxKind.ContinueStatement;

  public visitNode(sb: ScriptBuilder, node: ts.ContinueStatement, options: VisitOptions): void {
    const label = tsUtils.statement.getLabel(node);
    if (label !== undefined) {
      /* istanbul ignore next */
      sb.reportUnsupported(label);
    }

    sb.emitHelper(node, options, sb.helpers.continue);
  }
}
