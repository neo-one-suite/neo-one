import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [indexNumber, arrayVal]
// Output: [val]
export class GetArrayIndexHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    // [arrayVal, indexNumber]
    sb.emitOp(node, 'SWAP');
    // [arr, indexNumber]
    sb.emitHelper(node, options, sb.helpers.unwrapArray);
    // [arr, indexNumber, arr]
    sb.emitOp(node, 'TUCK');
    // [size, indexNumber, arr]
    sb.emitOp(node, 'ARRAYSIZE');
    // [indexNumber, size, indexNumber, arr]
    sb.emitOp(node, 'OVER');

    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [size > indexNumber, indexNumber, arr]
          sb.emitOp(node, 'GT');
        },
        whenTrue: () => {
          // [val]
          sb.emitOp(node, 'PICKITEM');
        },
        whenFalse: () => {
          // [indexNumber]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          // [val]
          sb.emitHelper(node, options, sb.helpers.createUndefined);
        },
      }),
    );
  }
}
