import { StringLiteral, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class StringLiteralCompiler extends NodeCompiler<StringLiteral> {
  public readonly kind: SyntaxKind = SyntaxKind.StringLiteral;
  public visitNode(sb: ScriptBuilder, expr: StringLiteral, options: VisitOptions): void {
    if (options.pushValue) {
      sb.emitPushString(expr, expr.getLiteralValue());
      sb.emitHelper(expr, options, sb.helpers.createString);
    }
  }
}
