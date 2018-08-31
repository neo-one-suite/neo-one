import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [objectVal, enumerator]
// Output: []
export class RawEnumeratorForEachFuncHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [callable, enumerator]
    sb.emitHelper(node, options, sb.helpers.getCallable({}));
    // [enumerator, callable]
    sb.emitOp(node, 'SWAP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [enumerator, enumerator, callable]
          sb.emitOp(node, 'DUP');
          // [boolean, enumerator, callable]
          sb.emitSysCall(node, 'Neo.Enumerator.Next');
        },
        each: (innerOptions) => {
          // [enumerator, enumerator, callable]
          sb.emitOp(node, 'DUP');
          // [key, enumerator, callable]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          // [1, value, enumerator, callable]
          sb.emitPushInt(node, 1);
          // [argsarr, enumerator, callable]
          sb.emitOp(node, 'PACK');
          // [2, argsarr, enumerator, callable]
          sb.emitPushInt(node, 2);
          // [callable, argsarr, enumerator, callable]
          sb.emitOp(node, 'PICK');
          // [enumerator, callable]
          sb.emitHelper(node, sb.noPushValueOptions(innerOptions), sb.helpers.call);
        },
      }),
    );
    // []
    sb.emitOp(node, 'DROP');
  }
}
