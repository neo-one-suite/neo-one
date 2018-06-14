import { SyntaxKind, WithStatement } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class WithStatementCompiler extends NodeCompiler<WithStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.WithStatement;

  public visitNode(sb: ScriptBuilder, node: WithStatement, _options: VisitOptions): void {
    sb.reportUnsupported(node);
  }
}
