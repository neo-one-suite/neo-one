import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface GetModuleHelperOptions {
  readonly moduleIndex: number;
}

// Input: [globalObjectVal]
// Output: [exports]
export class GetModuleHelper extends Helper {
  private readonly moduleIndex: number;

  public constructor(options: GetModuleHelperOptions) {
    super();
    this.moduleIndex = options.moduleIndex;
  }

  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [modules, index]
      sb.emitHelper(node, options, sb.helpers.getModules);
      // [index, modules]
      sb.emitPushInt(node, this.moduleIndex);
      // [exports]
      sb.emitOp(node, 'PICKITEM');
    }
  }
}
