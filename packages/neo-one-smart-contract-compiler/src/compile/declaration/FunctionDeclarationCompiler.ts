import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class FunctionDeclarationCompiler extends NodeCompiler<ts.FunctionDeclaration> {
  public readonly kind = ts.SyntaxKind.FunctionDeclaration;

  public visitNode(sb: ScriptBuilder, node: ts.FunctionDeclaration, options: VisitOptions): void {
    sb.emitHelper(node, options, sb.helpers.functionLike);
  }
}
