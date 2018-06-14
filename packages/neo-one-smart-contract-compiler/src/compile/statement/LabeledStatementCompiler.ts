import { LabeledStatement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class LabeledStatementCompiler extends NodeCompiler<LabeledStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.LabeledStatement;

  public visitNode(sb: ScriptBuilder, node: LabeledStatement, _options: VisitOptions): void {
    sb.reportUnsupported(node);
  }
}
