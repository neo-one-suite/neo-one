import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class BreakStatementCompiler extends NodeCompiler<ts.BreakStatement> {
  public readonly kind = ts.SyntaxKind.BreakStatement;

  public visitNode(sb: ScriptBuilder, node: ts.BreakStatement, options: VisitOptions): void {
    const label = tsUtils.statement.getLabel(node);
    if (label !== undefined) {
      /* istanbul ignore next */
      sb.reportUnsupported(label);
    }

    sb.emitHelper(node, options, sb.helpers.break);
  }
}
