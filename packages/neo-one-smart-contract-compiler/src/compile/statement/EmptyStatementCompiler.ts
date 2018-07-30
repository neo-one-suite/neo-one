import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class EmptyStatementCompiler extends NodeCompiler<ts.EmptyStatement> {
  public readonly kind = ts.SyntaxKind.EmptyStatement;

  public visitNode(_sb: ScriptBuilder, _node: ts.EmptyStatement, _options: VisitOptions): void {
    // tslint:disable-line
  }
}
