import { NullLiteral, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class NullLiteralCompiler extends NodeCompiler<NullLiteral> {
  public readonly kind: SyntaxKind = SyntaxKind.NullKeyword;

  public visitNode(
    sb: ScriptBuilder,
    expr: NullLiteral,
    options: VisitOptions,
  ): void {
    if (options.pushValue) {
      sb.emitHelper(expr, options, sb.helpers.createNull);
    }
  }
}
