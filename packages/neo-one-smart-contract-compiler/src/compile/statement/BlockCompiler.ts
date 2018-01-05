import { Block, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class BlockCompiler extends NodeCompiler<Block> {
  public readonly kind: SyntaxKind = SyntaxKind.Block;

  public visitNode(
    sb: ScriptBuilder,
    expr: Block,
    options: VisitOptions,
  ): void {
    sb.emitHelper(
      expr,
      options,
      sb.helpers.processStatements({ createScope: true }),
    );
  }
}
