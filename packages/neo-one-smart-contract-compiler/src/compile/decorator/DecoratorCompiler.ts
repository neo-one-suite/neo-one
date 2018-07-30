import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class DecoratorCompiler extends NodeCompiler<ts.Decorator> {
  public readonly kind = ts.SyntaxKind.Decorator;

  public visitNode(sb: ScriptBuilder, decl: ts.Decorator, _options: VisitOptions): void {
    sb.reportUnsupported(decl);
  }
}
