import { DefaultClause, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class DefaultClauseCompiler extends NodeCompiler<DefaultClause> {
  public readonly kind: SyntaxKind = SyntaxKind.DefaultClause;

  public visitNode(
    sb: ScriptBuilder,
    node: DefaultClause,
    options: VisitOptions,
  ): void {
    sb.emitOp(node, 'DROP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.processStatements({ createScope: false }),
    );
  }
}
