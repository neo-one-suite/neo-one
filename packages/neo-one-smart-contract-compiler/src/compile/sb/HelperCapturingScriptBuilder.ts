import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from './ScriptBuilder';
import { ScopeCapturingScriptBuilder } from './ScopeCapturingScriptBuilder';
import { Helper } from '../helper';
import { VisitOptions } from '../types';

export class HelperCapturingScriptBuilder extends ScopeCapturingScriptBuilder
  implements ScriptBuilder {
  private readonly capturedHelpersSet: Set<Helper> = new Set();
  private readonly capturedHelpers: Helper[] = [];

  public getHelpers(): Helper[] {
    return [...this.capturedHelpers];
  }

  public emitHelper<T extends Node>(
    node: T,
    options: VisitOptions,
    helper: Helper<T>,
  ): void {
    if (!this.capturedHelpersSet.has(helper)) {
      this.capturedHelpersSet.add(helper);
      this.capturedHelpers.push(helper);
      helper.emitGlobal(this, node, options);
    }
    helper.emit(this, node, options);
  }
}
