import { SyntaxKind } from 'ts-simple-ast';

import { ScriptBuilder } from './sb';
import { VisitOptions } from './types';

export abstract class NodeCompiler<TNode> {
  public abstract readonly kind: SyntaxKind;

  public abstract visitNode(
    sb: ScriptBuilder,
    node: TNode,
    options: VisitOptions,
  ): void;
}
