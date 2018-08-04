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

  public constructor(options: DebugLogHelperOptions) {
    super();
    this.count = options.count;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [number]
    sb.emitPushInt(node, this.count);
    // [arr]
    sb.emitOp(node, 'PACK');
    // []
    sb.emitHelper(node, options, sb.helpers.consoleLog);
    // []
    sb.emitOp(node, 'THROW');
  }
}
