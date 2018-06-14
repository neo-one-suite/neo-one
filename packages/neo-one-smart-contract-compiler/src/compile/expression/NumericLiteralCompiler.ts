import { NumericLiteral, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NumericLiteralCompiler extends NodeCompiler<NumericLiteral> {
  public readonly kind: SyntaxKind = SyntaxKind.NumericLiteral;

  public visitNode(sb: ScriptBuilder, expr: NumericLiteral, options: VisitOptions): void {
    if (options.pushValue) {
      sb.emitPushInt(expr, expr.getLiteralValue());
      sb.emitHelper(expr, options, sb.helpers.createNumber);
    }
  }
}
