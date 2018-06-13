import { Node } from 'ts-simple-ast';

import { CapturingScope, ResolvedScope } from '../scope';
import { BaseScriptBuilder } from './BaseScriptBuilder';
import { ScriptBuilder } from './ScriptBuilder';

export class ScopeCapturingScriptBuilder
  extends BaseScriptBuilder<CapturingScope>
  implements ScriptBuilder {
  private readonly scopes: CapturingScope[] = [];
  private readonly resolvedScopes: Map<
    Node,
    Map<number, ResolvedScope>
  > = new Map();

  public process(): void {
    super.process();
    this.resolveScopes();
  }

  public getScopes(): Map<Node, Map<number, ResolvedScope>> {
    return this.resolvedScopes;
  }

  protected createScope(
    node: Node,
    index: number,
    parent?: CapturingScope | undefined,
  ): CapturingScope {
    const scope = new CapturingScope(node, index, parent);
    this.scopes.push(scope);
    return scope;
  }

  private resolveScopes(): void {
    this.scopes.forEach((scope) => {
      this.resolveScope(scope);
    });
  }

  private resolveScope(scope: CapturingScope): ResolvedScope {
    let forNode = this.resolvedScopes.get(scope.node);
    if (forNode == null) {
      forNode = new Map();
      this.resolvedScopes.set(scope.node, forNode);
    }

    let resolved = forNode.get(scope.index);
    if (resolved == null) {
      const parent = scope.parent;
      if (parent == null) {
        resolved = scope.resolve();
      } else {
        resolved = scope.resolve(this.resolveScope(parent));
      }

      forNode.set(scope.index, resolved);
    }

    return resolved;
  }
}
