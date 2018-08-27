import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [arrayVal]
// Output: [val]
export class CreateArrayEntriesIterableIteratorHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [1, val]
    sb.emitPushInt(node, 1);
    // [argsarr]
    sb.emitOp(node, 'PACK');
    // [classVal, argsarr]
    sb.emitHelper(node, options, sb.helpers.getArrayEntriesIterableIteratorClass);
    // [thisVal]
    sb.emitHelper(node, options, sb.helpers.new());

    if (!optionsIn.pushValue) {
      // []
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');
    }
  }
}
