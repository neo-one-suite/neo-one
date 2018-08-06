import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TypeAssertionCompiler extends NodeCompiler<ts.TypeAssertion> {
  public readonly kind = ts.SyntaxKind.TypeAssertionExpression;
  /* istanbul ignore next */
  public visitNode(_sb: ScriptBuilder, _expr: ts.TypeAssertion, _options: VisitOptions): void {
    // do nothing
  }
}
