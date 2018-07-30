import * as ts from 'typescript';
import { ScriptBuilder } from './sb';
import { VisitOptions } from './types';

export abstract class NodeCompiler<TNode extends ts.Node = ts.Node> {
  public abstract readonly kind: TNode extends ts.Node & { readonly kind: infer TKind } ? TKind : never;

  public abstract visitNode(sb: ScriptBuilder, node: TNode, options: VisitOptions): void;
}
