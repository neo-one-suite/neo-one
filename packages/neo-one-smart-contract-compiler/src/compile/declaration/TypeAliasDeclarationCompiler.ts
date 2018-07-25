import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TypeAliasDeclarationCompiler extends NodeCompiler<ts.TypeAliasDeclaration> {
  public readonly kind = ts.SyntaxKind.TypeAliasDeclaration;

  public visitNode(_sb: ScriptBuilder, _node: ts.TypeAliasDeclaration, _optionsIn: VisitOptions): void {
    // do nothing
  }
}
