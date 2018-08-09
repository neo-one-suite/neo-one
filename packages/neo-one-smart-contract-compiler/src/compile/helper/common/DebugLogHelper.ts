import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface DebugLogHelperOptions {
  readonly count: number;
}

// Input: []
// Output: []
export class DebugLogHelper extends Helper {
  private readonly count: number;

  /* istanbul ignore next */
  public constructor(options: DebugLogHelperOptions) {
    /* istanbul ignore next */
    super();
    /* istanbul ignore next */
    this.count = options.count;
  }

  /* istanbul ignore next */
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    /* istanbul ignore next */
    const options = sb.pushValueOptions(optionsIn);
    // [number]
    /* istanbul ignore next */
    sb.emitPushInt(node, this.count);
    // [arr]
    /* istanbul ignore next */
    sb.emitOp(node, 'PACK');
    // []
    /* istanbul ignore next */
    sb.emitHelper(node, options, sb.helpers.consoleLog);
    // []
    /* istanbul ignore next */
    sb.emitOp(node, 'THROW');
  }
}
