import { MetaProperty, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class MetaPropertyCompiler extends NodeCompiler<MetaProperty> {
  public readonly kind: SyntaxKind = SyntaxKind.MetaProperty;

  public visitNode(sb: ScriptBuilder, expr: MetaProperty, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
