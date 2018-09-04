import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [objectVal, arr]
// Output: [boolean]
export class ArrSomeFuncHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [callable, arr]
    sb.emitHelper(node, options, sb.helpers.getCallable({}));
    // [arr, callable]
    sb.emitOp(node, 'SWAP');
    // [enumerator, callable]
    sb.emitSysCall(node, 'Neo.Enumerator.Create');
    // [idx, enumerator, callable]
    sb.emitPushInt(node, 0);
    // [result, idx, enumerator, callable]
    sb.emitPushBoolean(node, false);
    // [enumerator, result, idx, callable]
    sb.emitOp(node, 'ROT');
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [result, enumerator, result, idx, callable]
          sb.emitOp(node, 'OVER');
          // [!result, enumerator, result, idx, callable]
          sb.emitOp(node, 'NOT');
          // [enumerator, !result, enumerator, result, idx, callable]
          sb.emitOp(node, 'OVER');
          // [boolean, !result, enumerator, result, idx, callable]
          sb.emitSysCall(node, 'Neo.Enumerator.Next');
          // [boolean, enumerator, result, idx, callable]
          sb.emitOp(node, 'BOOLAND');
        },
        each: (innerOptions) => {
          // [enumerator, idx, callable]
          sb.emitOp(node, 'NIP');
          // [enumerator, enumerator, idx, callable]
          sb.emitOp(node, 'DUP');
          // [value, enumerator, idx, callable]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          // [2, value, enumerator, idx, callable]
          sb.emitPushInt(node, 2);
          // [idx, value, enumerator, idx, callable]
          sb.emitOp(node, 'PICK');
          // [idx, value, enumerator, idx, callable]
          sb.emitHelper(node, options, sb.helpers.wrapNumber);
          // [value, idx, enumerator, idx, callable]
          sb.emitOp(node, 'SWAP');
          // [2, value, idx, enumerator, idx, callable]
          sb.emitPushInt(node, 2);
          // [argsarr, enumerator, idx, callable]
          sb.emitOp(node, 'PACK');
          // [3, argsarr, enumerator, idx, callable]
          sb.emitPushInt(node, 3);
          // [callable, argsarr, enumerator, idx, callable]
          sb.emitOp(node, 'PICK');
          // [val, enumerator, idx, callable]
          sb.emitHelper(node, sb.pushValueOptions(innerOptions), sb.helpers.call);
          // [result, enumerator, idx, callable]
          sb.emitHelper(node, sb.pushValueOptions(innerOptions), sb.helpers.unwrapBoolean);
          // [idx, result, enumerator, callable]
          sb.emitOp(node, 'ROT');
          // [idx, result, enumerator, callable]
          sb.emitOp(node, 'INC');
          // [result, idx, enumerator, callable]
          sb.emitOp(node, 'SWAP');
          // [enumerator, result, idx, callable]
          sb.emitOp(node, 'ROT');
        },
      }),
    );
    // [result, idx, callable]
    sb.emitOp(node, 'DROP');
    // [result, callable]
    sb.emitOp(node, 'NIP');
    // [result]
    sb.emitOp(node, 'NIP');
  }
}
