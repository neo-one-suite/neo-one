import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class MetaPropertyCompiler extends NodeCompiler<ts.MetaProperty> {
  public readonly kind = ts.SyntaxKind.MetaProperty;

  public visitNode(sb: ScriptBuilder, expr: ts.MetaProperty, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
