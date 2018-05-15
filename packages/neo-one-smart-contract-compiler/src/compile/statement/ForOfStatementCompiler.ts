import { ForOfStatement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ForOfStatementCompiler extends NodeCompiler<ForOfStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.ForOfStatement;

  public visitNode(
    sb: ScriptBuilder,
    node: ForOfStatement,
    options: VisitOptions,
  ): void {
    sb.reportUnsupported(node);
  }
}
