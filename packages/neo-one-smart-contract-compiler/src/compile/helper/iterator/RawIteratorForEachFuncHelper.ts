import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [objectVal, iterator]
// Output: []
export class RawIteratorForEachFuncHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorForEachFuncBase({
        handleNext: () => {
          // [key, iterator, callable]
          sb.emitSysCall(node, 'Neo.Iterator.Key');
          // [iterator, key, iterator, callable]
          sb.emitOp(node, 'OVER');
          // [value, key, iterator, callable]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          // [2, value, key, iterator, callable]
          sb.emitPushInt(node, 2);
          // [argsarr, iterator, callable]
          sb.emitOp(node, 'PACK');
        },
      }),
    );
  }
}
