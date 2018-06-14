import { Identifier, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class IdentifierCompiler extends NodeCompiler<Identifier> {
  public readonly kind: SyntaxKind = SyntaxKind.Identifier;

  public visitNode(sb: ScriptBuilder, expr: Identifier, options: VisitOptions): void {
    if (options.setValue) {
      sb.scope.set(sb, expr, sb.noSetValueOptions(options), expr.getText());
    }

    if (options.pushValue) {
      if (
        expr.compilerNode.originalKeywordKind !== undefined &&
        expr.compilerNode.originalKeywordKind === SyntaxKind.UndefinedKeyword
      ) {
        sb.emitHelper(expr, options, sb.helpers.createUndefined);
      } else {
        sb.scope.get(sb, expr, options, expr.getText());
      }
    }
  }
}
