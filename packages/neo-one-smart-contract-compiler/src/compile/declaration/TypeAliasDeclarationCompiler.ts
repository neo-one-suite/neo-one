import { SyntaxKind, TypeAliasDeclaration } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TypeAliasDeclarationCompiler extends NodeCompiler<TypeAliasDeclaration> {
  public readonly kind: SyntaxKind = SyntaxKind.TypeAliasDeclaration;

  public visitNode(_sb: ScriptBuilder, _node: TypeAliasDeclaration, _optionsIn: VisitOptions): void {
    // do nothing
  }
}
