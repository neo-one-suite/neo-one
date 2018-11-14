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
          // [n === 0, x, n]
          sb.emitOp(node, 'NUMEQUAL');
        },
        whenTrue: () => {
          // [n]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          // [1]
          sb.emitPushInt(node, 1);
        },
        whenFalse: () => {
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [n, x, n]
                sb.emitOp(node, 'OVER');
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

          const y = sb.scope.addUnique();
          const n = sb.scope.addUnique();
          const x = sb.scope.addUnique();

          // [n]
          sb.scope.set(sb, node, options, x);
          // []
          sb.scope.set(sb, node, options, n);
          // [1]
          sb.emitPushInt(node, 1);
          // []
          sb.scope.set(sb, node, options, y);
          sb.emitHelper(
            node,
            options,
            sb.helpers.forLoop({
              condition: () => {
                // [n]
                sb.scope.get(sb, node, options, n);
                // [1, n]
                sb.emitPushInt(node, 1);
                // [n > 1]
                sb.emitOp(node, 'GT');
              },
              each: () => {
                sb.emitHelper(
                  node,
                  options,
                  sb.helpers.if({
                    condition: () => {
                      // [n]
                      sb.scope.get(sb, node, options, n);
                      // [n, n]
                      sb.emitOp(node, 'DUP');
                      // [2, n, n]
                      sb.emitPushInt(node, 2);
                      // [n % 2, n]
                      sb.emitOp(node, 'MOD');
                      // [0, n % 2, n]
                      sb.emitPushInt(node, 0);
                      // [n % 2 == 0, n]
                      sb.emitOp(node, 'NUMEQUAL');
                    },
                    whenTrue: () => {
                      // [2, n]
                      sb.emitPushInt(node, 2);
                      // [n / 2]
                      sb.emitOp(node, 'DIV');
                      // []
                      sb.scope.set(sb, node, options, n);
                      // [x]
                      sb.scope.get(sb, node, options, x);
                      // [x, x]
                      sb.emitOp(node, 'DUP');
                      // [x * x]
                      sb.emitOp(node, 'MUL');
                      // []
                      sb.scope.set(sb, node, options, x);
                    },
                    whenFalse: () => {
                      // [n - 1]
                      sb.emitOp(node, 'DEC');
                      // [2, n]
                      sb.emitPushInt(node, 2);
                      // [n / 2]
                      sb.emitOp(node, 'DIV');
                      // []
                      sb.scope.set(sb, node, options, n);
                      // [x]
                      sb.scope.get(sb, node, options, x);
                      // [x, x]
                      sb.emitOp(node, 'DUP');
                      // [y, x, x]
                      sb.scope.get(sb, node, options, y);
                      // [x * y, x]
                      sb.emitOp(node, 'MUL');
                      // [x]
                      sb.scope.set(sb, node, options, y);
                      // [x, x]
                      sb.emitOp(node, 'DUP');
                      // [x * x]
                      sb.emitOp(node, 'MUL');
                      // []
                      sb.scope.set(sb, node, options, x);
                    },
                  }),
                );
              },
              cleanup: () => {
                // do nothing
              },
            }),
          );

          // [x]
          sb.scope.get(sb, node, options, x);
          // [y, x]
          sb.scope.get(sb, node, options, y);
          // [x * y]
          sb.emitOp(node, 'MUL');
        },
      }),
    );
  }
}
