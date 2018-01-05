import { SpreadElement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class SpreadElementCompiler extends NodeCompiler<SpreadElement> {
  public readonly kind: SyntaxKind = SyntaxKind.SpreadElement;
  public visitNode(
    sb: ScriptBuilder,
    expr: SpreadElement,
    options: VisitOptions,
  ): void {
    sb.reportUnsupported(expr);
  }
}
