import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class SpreadElementCompiler extends NodeCompiler<ts.SpreadElement> {
  public readonly kind = ts.SyntaxKind.SpreadElement;
  public visitNode(sb: ScriptBuilder, expr: ts.SpreadElement, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
