import BN from 'bn.js';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NumericLiteralCompiler extends NodeCompiler<ts.NumericLiteral> {
  public readonly kind = ts.SyntaxKind.NumericLiteral;

  public visitNode(sb: ScriptBuilder, expr: ts.NumericLiteral, options: VisitOptions): void {
    if (options.pushValue) {
      sb.emitPushInt(expr, new BN(expr.text.replace('_', ''), 10));
      sb.emitHelper(expr, options, sb.helpers.wrapNumber);
    }
  }
}
