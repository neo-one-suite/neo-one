import { SyntaxKind, TypeAssertion } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TypeAssertionCompiler extends NodeCompiler<TypeAssertion> {
  public readonly kind: SyntaxKind = SyntaxKind.TypeAssertionExpression;
  public visitNode(sb: ScriptBuilder, expr: TypeAssertion, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
