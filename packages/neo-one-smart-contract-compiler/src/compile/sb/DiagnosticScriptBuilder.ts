import ts from 'typescript';
import { Helper } from '../helper';
import { DiagnosticScope } from '../scope';
import { VisitOptions } from '../types';
import { BaseScriptBuilder } from './BaseScriptBuilder';
import { ScriptBuilder } from './ScriptBuilder';

export class DiagnosticScriptBuilder extends BaseScriptBuilder<DiagnosticScope> implements ScriptBuilder {
  private readonly mutableCapturedHelpersSet: Set<Helper> = new Set();

  public emitHelper<T extends ts.Node>(node: T, options: VisitOptions, helper: Helper<T>): void {
    if (!this.mutableCapturedHelpersSet.has(helper)) {
      this.mutableCapturedHelpersSet.add(helper);
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

  protected createScope(): DiagnosticScope {
    return new DiagnosticScope();
  }
}
