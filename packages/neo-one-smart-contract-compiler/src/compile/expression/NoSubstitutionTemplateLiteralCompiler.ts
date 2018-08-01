import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NoSubstitutionTemplateLiteralCompiler extends NodeCompiler<ts.NoSubstitutionTemplateLiteral> {
  public readonly kind = ts.SyntaxKind.NoSubstitutionTemplateLiteral;

  public visitNode(sb: ScriptBuilder, expr: ts.NoSubstitutionTemplateLiteral, options: VisitOptions): void {
    if (options.pushValue) {
      sb.emitPushString(expr, tsUtils.literal.getLiteralValue(expr));
      sb.emitHelper(expr, options, sb.helpers.createString);
    }
  }
}
