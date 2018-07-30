import ts from 'typescript';
import { Transpiler } from './transpiler';

export abstract class NodeTranspiler<TNode extends ts.Node = ts.Node> {
  public abstract readonly kind: TNode extends ts.Node & { readonly kind: infer TKind } ? TKind : never;

  public abstract visitNode(transpiler: Transpiler, node: TNode): TNode;
}
