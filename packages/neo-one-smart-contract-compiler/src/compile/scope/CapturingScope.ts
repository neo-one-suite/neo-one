import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { ResolvedScope } from './ResolvedScope';
import { Name, Scope } from './Scope';

export class CapturingScope implements Scope {
  private mutableVariableCount = 0;
  private readonly bindings: Set<string> = new Set();

  public constructor(
    public readonly node: Node,
    public readonly index: number,
    public readonly parent?: CapturingScope | undefined,
  ) {}

  public add(name: string): Name {
    this.mutableVariableCount += 1;
    this.bindings.add(name);

    return { nameBrand: 0 };
  }

  public addUnique(): Name {
    this.mutableVariableCount += 1;

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
    return this.bindings.has(name) || (this.parent !== undefined && this.parent.hasBinding(name));
  }

  public pushAll(sb: ScriptBuilder, node: Node): void {
    sb.emitOp(node, 'NOP');
  }

  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions, func: (options: VisitOptions) => void): void {
    sb.emitOp(node, 'NOP');
    func(options);
    sb.emitOp(node, 'NOP');
  }

  public resolve(parent?: ResolvedScope | undefined): ResolvedScope {
    return new ResolvedScope(this.mutableVariableCount, parent);
  }
}
