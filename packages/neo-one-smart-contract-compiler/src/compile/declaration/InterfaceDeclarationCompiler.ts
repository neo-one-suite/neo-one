import { InterfaceDeclaration, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class InterfaceDeclarationCompiler extends NodeCompiler<InterfaceDeclaration> {
  public readonly kind: SyntaxKind = SyntaxKind.InterfaceDeclaration;

  public visitNode(_sb: ScriptBuilder, _node: InterfaceDeclaration, _optionsIn: VisitOptions): void {
    // do nothing
  }
}
