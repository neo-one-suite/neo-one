import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class InterfaceDeclarationCompiler extends NodeCompiler<ts.InterfaceDeclaration> {
  public readonly kind = ts.SyntaxKind.InterfaceDeclaration;

  public visitNode(_sb: ScriptBuilder, _node: ts.InterfaceDeclaration, _optionsIn: VisitOptions): void {
    // do nothing
  }
}
