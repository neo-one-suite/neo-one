import ts from 'typescript';
import { Helper } from '../helper';
import { VisitOptions } from '../types';
import { ScopeCapturingScriptBuilder } from './ScopeCapturingScriptBuilder';
import { ScriptBuilder } from './ScriptBuilder';

export class HelperCapturingScriptBuilder extends ScopeCapturingScriptBuilder implements ScriptBuilder {
  private readonly mutableCapturedHelpersSet: Set<Helper> = new Set();
  private readonly mutableCapturedHelpers: Helper[] = [];

  public getHelpers(): readonly Helper[] {
    return [...this.mutableCapturedHelpers];
  }

  public emitHelper<T extends ts.Node>(node: T, options: VisitOptions, helper: Helper<T>): void {
    if (!this.mutableCapturedHelpersSet.has(helper)) {
      this.mutableCapturedHelpersSet.add(helper);
      this.mutableCapturedHelpers.push(helper);
      helper.emitGlobal(this, node, options);
    }
    helper.emit(this, node, options);
  }
}
