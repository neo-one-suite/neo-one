import { DebuggerStatement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class DebuggerStatementCompiler extends NodeCompiler<DebuggerStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.DebuggerStatement;

  public visitNode(sb: ScriptBuilder, node: DebuggerStatement, _options: VisitOptions): void {
    sb.reportUnsupported(node);
  }
}
