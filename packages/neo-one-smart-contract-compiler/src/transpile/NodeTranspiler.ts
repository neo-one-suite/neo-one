import { SyntaxKind } from 'ts-simple-ast';

import { Transpiler } from './transpiler';
import { VisitOptions } from './types';

export abstract class NodeTranspiler<TNode> {
  public abstract readonly kind: SyntaxKind;

  public abstract visitNode(
    transpiler: Transpiler,
    node: TNode,
    options: VisitOptions,
  ): void;
}
