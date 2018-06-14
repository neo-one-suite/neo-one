import { NotEmittedStatement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NotEmittedStatementCompiler extends NodeCompiler<NotEmittedStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.NotEmittedStatement;

  public visitNode(sb: ScriptBuilder, node: NotEmittedStatement, _options: VisitOptions): void {
    sb.reportUnsupported(node);
  }
}
