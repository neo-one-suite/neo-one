import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class BlockCompiler extends NodeCompiler<ts.Block> {
  public readonly kind = ts.SyntaxKind.Block;

  public visitNode(sb: ScriptBuilder, expr: ts.Block, options: VisitOptions): void {
    sb.emitHelper(expr, options, sb.helpers.processStatements({ createScope: true }));
  }
}
