import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [right, left]
// Output: [arr]
export class ArrConcatHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [enumerator, result]
    sb.emitSysCall(node, 'Neo.Enumerator.Create');
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [enumerator, result, enumerator]
          sb.emitOp(node, 'TUCK');
          // [boolean, result, enumerator]
          sb.emitSysCall(node, 'Neo.Enumerator.Next');
        },
        each: () => {
          // [result, enumerator, result]
          sb.emitOp(node, 'TUCK');
          // [enumerator, result, enumerator, result]
          sb.emitOp(node, 'OVER');
          // [value, result, enumerator, result]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          // [enumerator, result]
          sb.emitOp(node, 'APPEND');
        },
      }),
    );
    // [result]
    sb.emitOp(node, 'NIP');
  }
}
