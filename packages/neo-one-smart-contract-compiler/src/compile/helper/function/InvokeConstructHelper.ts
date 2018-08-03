import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { InternalFunctionProperties } from './InternalFunctionProperties';

export interface InvokeConstructHelperOptions {
  readonly noArgs?: boolean;
}

// Input: [objectVal, thisObjectVal, ?argsarray]
// Output: []
export class InvokeConstructHelper extends Helper {
  private readonly noArgs: boolean;

  public constructor(options: InvokeConstructHelperOptions = { noArgs: false }) {
    super();
    this.noArgs = options.noArgs || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // ['construct', objectVal, thisObjectVal, ?argsarray]
    sb.emitPushString(node, InternalFunctionProperties.Construct);
    // [func, thisObjectVal, ?argsarray]
    sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
    // [func, ?argsarray]
    sb.emitHelper(node, options, sb.helpers.bindFunctionThis({ overwrite: true }));
    if (this.noArgs) {
      // [0, func]
      sb.emitPushInt(node, 0);
      // [argsarray, func]
      sb.emitOp(node, 'NEWARRAY');
      // [func, argsarray]
      sb.emitOp(node, 'SWAP');
    }
    // []
    sb.emitHelper(node, optionsIn, sb.helpers.call);
  }
}
