import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [right, left]
// Output: [arr]
export class ArrConcatHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [map, result]
    sb.emitHelper(node, options, sb.helpers.arrToMap);
    // [enumerator, result]
    sb.emitHelper(node, options, sb.helpers.createMapIterator);
    // [result]
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [enumerator, result, enumerator]
          sb.emitOp(node, 'TUCK');
          // [boolean, result, enumerator]
          sb.emitSysCall(node, 'System.Iterator.Next');
        },
        each: () => {
          // [result, enumerator, result]
          sb.emitOp(node, 'TUCK');
          // [enumerator, result, enumerator, result]
          sb.emitOp(node, 'OVER');
          // [value, result, enumerator, result]
          sb.emitHelper(node, options, sb.helpers.getMapIteratorValue);
          // [enumerator, result]
          sb.emitOp(node, 'APPEND');
        },
        cleanup: () => {
          // [result]
          sb.emitOp(node, 'NIP');
        },
      }),
    );
  }
}
