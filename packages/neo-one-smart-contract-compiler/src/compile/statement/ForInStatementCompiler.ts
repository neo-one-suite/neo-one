import { ForInStatement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ForInStatementCompiler extends NodeCompiler<ForInStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.ForInStatement;

  public visitNode(
    sb: ScriptBuilder,
    node: ForInStatement,
    options: VisitOptions,
  ): void {
    sb.reportUnsupported(node);
  }
}
