import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NullLiteralCompiler extends NodeCompiler<ts.NullLiteral> {
  public readonly kind = ts.SyntaxKind.NullKeyword;

  public visitNode(sb: ScriptBuilder, expr: ts.NullLiteral, options: VisitOptions): void {
    if (options.pushValue) {
      sb.emitHelper(expr, options, sb.helpers.createNull);
    }
  }
}
