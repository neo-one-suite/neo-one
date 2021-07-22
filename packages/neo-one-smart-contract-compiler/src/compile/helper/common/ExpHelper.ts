import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [n, x]
// Output: [number]
export class ExpHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [n, x, n]
          sb.emitOp(node, 'TUCK');
          // [0, n, x, n]
          sb.emitPushInt(node, 0);
          // [n < 0, x, n]
          sb.emitOp(node, 'LT');
        },
        whenTrue: () => {
          // [1, x, n]
          sb.emitPushInt(node, 1);
          // [x, 1, n]
          sb.emitOp(node, 'SWAP');
          // [x, n]
          sb.emitOp(node, 'DIV');
          // [n, x]
          sb.emitOp(node, 'SWAP');
          // [n, x]
          sb.emitOp(node, 'NEGATE');
          // [x, n]
          sb.emitOp(node, 'SWAP');
        },
      }),
    );
    // [n, x]
    sb.emitOp(node, 'SWAP');
    // [result]
    sb.emitOp(node, 'POW');
  }
}
