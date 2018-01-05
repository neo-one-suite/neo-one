import { Decorator, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class DecoratorCompiler extends NodeCompiler<Decorator> {
  public readonly kind: SyntaxKind = SyntaxKind.Decorator;

  public visitNode(
    sb: ScriptBuilder,
    decl: Decorator,
    options: VisitOptions,
  ): void {
    sb.reportUnsupported(decl);
  }
}
