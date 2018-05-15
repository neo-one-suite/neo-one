import { Node } from 'ts-simple-ast';

import { ResolvedScope } from './ResolvedScope';
import { Name, Scope } from './Scope';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class CapturingScope implements Scope {
  private variableCount: number = 0;
  private bindings: Set<string> = new Set();

  constructor(
    public readonly node: Node,
    public readonly index: number,
    public readonly parent?: CapturingScope | undefined,
  ) {}

  public add(name: string): Name {
    this.variableCount += 1;
    this.bindings.add(name);
    return { nameBrand: 0 };
  }

  public addUnique(): Name {
    this.variableCount += 1;
    return { nameBrand: 0 };
  }

  public set(sb: ScriptBuilder, node: Node): void {
    sb.emitOp(node, 'NOP');
  }

  public get(sb: ScriptBuilder, node: Node): void {
    sb.emitOp(node, 'NOP');
  }

  public getThis(sb: ScriptBuilder, node: Node): void {
    sb.emitOp(node, 'NOP');
  }

  public setThis(sb: ScriptBuilder, node: Node): void {
    sb.emitOp(node, 'NOP');
  }

  public getGlobal(sb: ScriptBuilder, node: Node): void {
    sb.emitOp(node, 'NOP');
  }

  public setGlobal(sb: ScriptBuilder, node: Node): void {
    sb.emitOp(node, 'NOP');
  }

  public hasBinding(name: string): boolean {
    return (
      this.bindings.has(name) ||
      (this.parent != null && this.parent.hasBinding(name))
    );
  }

  public pushAll(sb: ScriptBuilder, node: Node): void {
    sb.emitOp(node, 'NOP');
  }

  public emit(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    func: (options: VisitOptions) => void,
  ): void {
    sb.emitOp(node, 'NOP');
    func(options);
    sb.emitOp(node, 'NOP');
  }

  public resolve(parent?: ResolvedScope | undefined): ResolvedScope {
    return new ResolvedScope(this.variableCount, parent);
  }
}
