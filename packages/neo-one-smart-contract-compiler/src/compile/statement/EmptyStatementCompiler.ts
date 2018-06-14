import { EmptyStatement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class EmptyStatementCompiler extends NodeCompiler<EmptyStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.EmptyStatement;

  public visitNode(_sb: ScriptBuilder, _node: EmptyStatement, _options: VisitOptions): void {
    // tslint:disable-line
  }
}
