import stringify from 'safe-stable-stringify';
import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { InternalFunctionProperties } from './InternalFunctionProperties';

export interface InvokeCallHelperOptions {
  readonly bindThis?: boolean;
  readonly overwriteThis?: boolean;
  readonly noArgs?: boolean;
}

// Input: [objectVal, ?thisVal, ?argsarray]
// Output: [val]
export class InvokeCallHelper extends Helper {
  public static getKey(options: InvokeCallHelperOptions = { bindThis: false, noArgs: false }): string {
    const bindThis = options.bindThis || false;
    const overwriteThis = options.overwriteThis || false;
    const noArgs = options.noArgs || false;

    return stringify({ bindThis, overwriteThis, noArgs });
  }

  private readonly bindThis: boolean;
  private readonly overwriteThis: boolean;
  private readonly noArgs: boolean;

  public constructor(options: InvokeCallHelperOptions = { bindThis: false, noArgs: false }) {
    super();
    this.bindThis = options.bindThis || false;
    this.overwriteThis = options.overwriteThis || false;
    this.noArgs = options.noArgs || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // ['call', objectVal, ?thisVal, ?argsarray]
    sb.emitPushString(node, InternalFunctionProperties.Call);
    // [func, ?thisVal, ?argsarray]
    sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
    if (this.bindThis) {
      // [func, ?argsarray]
      sb.emitHelper(node, options, sb.helpers.bindFunctionThis({ overwrite: this.overwriteThis }));
    }
    if (this.noArgs) {
      // [0, func]
      sb.emitPushInt(node, 0);
      // [argsarray, func]
      sb.emitOp(node, 'NEWARRAY');
      // [func, argsarray]
      sb.emitOp(node, 'SWAP');
    }
    // [val]
    sb.emitHelper(node, optionsIn, sb.helpers.call);
  }
}
