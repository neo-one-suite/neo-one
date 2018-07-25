import ts from 'typescript';
import { CapturingScope, ResolvedScope } from '../scope';
import { BaseScriptBuilder } from './BaseScriptBuilder';
import { ScriptBuilder } from './ScriptBuilder';

export class ScopeCapturingScriptBuilder extends BaseScriptBuilder<CapturingScope> implements ScriptBuilder {
  private readonly mutableScopes: CapturingScope[] = [];
  private readonly resolvedScopes: Map<ts.Node, Map<number, ResolvedScope>> = new Map();

  public process(): void {
    super.process();
    this.resolveScopes();
  }

  public getScopes(): Map<ts.Node, Map<number, ResolvedScope>> {
    return this.resolvedScopes;
  }

  protected createScope(node: ts.Node, index: number, parent?: CapturingScope | undefined): CapturingScope {
    const scope = new CapturingScope(node, index, parent);
    this.mutableScopes.push(scope);

    return scope;
  }

  private resolveScopes(): void {
    this.mutableScopes.forEach((scope) => {
      this.resolveScope(scope);
    });
  }

  private resolveScope(scope: CapturingScope): ResolvedScope {
    let forNode = this.resolvedScopes.get(scope.node);
    if (forNode === undefined) {
      forNode = new Map();
      this.resolvedScopes.set(scope.node, forNode);
    }

    let resolved = forNode.get(scope.index);
    if (resolved === undefined) {
      const parent = scope.parent;
      resolved = parent === undefined ? scope.resolve() : scope.resolve(this.resolveScope(parent));

      forNode.set(scope.index, resolved);
    }

    return resolved;
  }
}
