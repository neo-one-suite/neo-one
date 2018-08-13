import ts from 'typescript';
import { Helper } from '../helper';
import { CapturingScope } from '../scope';
import { VisitOptions } from '../types';
import { BaseScriptBuilder } from './BaseScriptBuilder';
import { ScriptBuilder } from './ScriptBuilder';

export class DiagnosticScriptBuilder extends BaseScriptBuilder<CapturingScope> implements ScriptBuilder {
  private readonly mutableCapturedHelpersSet: Set<Helper> = new Set();
  private readonly mutableCapturedHelpers: Helper[] = [];
  private readonly mutableScopes: CapturingScope[] = [];

  public emitHelper<T extends ts.Node>(node: T, options: VisitOptions, helper: Helper<T>): void {
    if (!this.mutableCapturedHelpersSet.has(helper)) {
      this.mutableCapturedHelpersSet.add(helper);
      this.mutableCapturedHelpers.push(helper);
      helper.emitGlobal(this, node, options);
    }
    helper.emit(this, node, options);
  }

  public emitOp(): void {
    // do nothing
  }

  public emitPushInt(): void {
    // do nothing
  }

  public emitPushBoolean(): void {
    // do nothing
  }

  public emitPushString(): void {
    // do nothing
  }

  public emitPushBuffer(): void {
    // do nothing
  }

  public emitJmp(): void {
    // do nothing
  }

  public emitBytecode(): void {
    // do nothing
  }

  public emitCall(): void {
    // do nothing
  }

  public emitSysCall(): void {
    // do nothing
  }

  public emitLine(): void {
    // do nothing
  }

  protected createScope(node: ts.Node, index: number, parent?: CapturingScope | undefined): CapturingScope {
    const scope = new CapturingScope(node, index, parent);
    this.mutableScopes.push(scope);

    return scope;
  }
}
