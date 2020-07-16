import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Types } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinInstanceMemberCall } from '../../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../../types';

// tslint:disable-next-line export-name
export class ArrayStoragePop extends BuiltinInstanceMemberCall {
  public canCall(): boolean {
    return true;
  }

  public emitCall(
    sb: ScriptBuilder,
    func: CallMemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
    visited: boolean,
  ): void {
    const options = sb.pushValueOptions(optionsIn);
    if (!visited) {
      // [arrayVal]
      sb.visit(tsUtils.expression.getExpression(func), options);
    }

    // [val, val]
    sb.emitOp(node, 'DUP');
    // [idx, val]
    sb.emitHelper(node, options, sb.helpers.getArrayStorageLength);
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [idx, idx, val]
          sb.emitOp(node, 'DUP');
          // [0, idx, idx, val]
          sb.emitPushInt(node, 0);
          // [boolean, idx, val]
          sb.emitOp(node, 'NUMEQUAL');
        },
        whenTrue: () => {
          // [val]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          if (optionsIn.pushValue) {
            // [val]
            sb.emitHelper(node, options, sb.helpers.wrapUndefined);
          }
        },
        whenFalse: () => {
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                sb.emitOp(node, 'DUP');
                sb.emitPushInt(node, 1);
                sb.emitOp(node, 'NUMEQUAL');
              },
              whenTrue: () => {
                sb.emitOp(node, 'DROP');
                sb.emitPushInt(node, 0);
              },
              whenFalse: () => {
                // [idx, val]
                sb.emitOp(node, 'DEC');
              },
            }),
          );
          // [val, idx]
          sb.emitOp(node, 'SWAP');
          // [val, idx, val]
          sb.emitOp(node, 'TUCK');
          // [idx, val, idx, val]
          sb.emitOp(node, 'OVER');
          // [idx, val, idx, val]
          sb.emitHelper(node, options, sb.helpers.coerceToInt);
          // [idxVal, val, idx, val]
          sb.emitHelper(node, options, sb.helpers.wrapNumber);
          if (optionsIn.pushValue) {
            // [val, idxVal, idx, val]
            sb.emitOp(node, 'SWAP');
            // [val, idxVal, val, idx, val]
            sb.emitOp(node, 'TUCK');
            // [idxVal, val, idxVal, val, idx, val]
            sb.emitOp(node, 'OVER');
            // [deletedVal, idxVal, val, idx, val]
            sb.emitHelper(
              node,
              options,
              sb.helpers.getStructuredStorage({
                type: Types.ArrayStorage,
                keyType: undefined,
                knownKeyType: Types.Number,
              }),
            );
            // [5, deletedVal, idxVal, val, idx, val]
            sb.emitPushInt(node, 5);
            // [deletedVal, idxVal, val, idx, val, deletedVal]
            sb.emitOp(node, 'XTUCK');
            // [idxVal, val, idx, val, deletedVal]
            sb.emitOp(node, 'DROP');
          }
          // [idxVal, val]
          sb.emitHelper(
            node,
            sb.noPushValueOptions(options),
            sb.helpers.deleteStructuredStorage({
              type: Types.ArrayStorage,
              keyType: undefined,
              knownKeyType: Types.Number,
            }),
          );
          // []
          sb.emitHelper(node, options, sb.helpers.putArrayStorageLength);
        },
      }),
    );
  }
}
