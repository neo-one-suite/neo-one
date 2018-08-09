import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class StringLiteralCompiler extends NodeCompiler<ts.StringLiteral> {
  public readonly kind = ts.SyntaxKind.StringLiteral;
  public visitNode(sb: ScriptBuilder, expr: ts.StringLiteral, options: VisitOptions): void {
    if (options.pushValue) {
      sb.emitPushString(expr, tsUtils.literal.getLiteralValue(expr));
      sb.emitHelper(expr, options, sb.helpers.wrapString);
    }
  }
}
