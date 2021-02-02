import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberCall } from '../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ArrayPop extends BuiltinInstanceMemberCall {
  public canCall(_sb: ScriptBuilder, _func: CallMemberLikeExpression, _node: ts.CallExpression): boolean {
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

    // [arr]
    sb.emitHelper(node, options, sb.helpers.unwrapArray);
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [arr, arr]
          sb.emitOp(node, 'DUP');
          // [number, arr]
          sb.emitOp(node, 'SIZE');
          // [0, number, arr]
          sb.emitPushInt(node, 0);
          // [boolean, arr]
          sb.emitOp(node, 'NUMEQUAL');
        },
        whenTrue: () => {
          // []
          sb.emitOp(node, 'DROP');
          // [val]
          sb.emitHelper(node, options, sb.helpers.wrapUndefined);
        },
        whenFalse: () => {
          // [arr, arr]
          sb.emitOp(node, 'DUP');
          // [size, arr]
          sb.emitOp(node, 'SIZE');
          // [size - 1, arr]
          sb.emitOp(node, 'DEC');
          // [arr, size - 1]
          sb.emitOp(node, 'SWAP');
          // [arr, size - 1, arr]
          sb.emitOp(node, 'TUCK');
          // [size - 1, arr, size - 1, arr]
          sb.emitOp(node, 'OVER');
          // [val, size - 1, arr]
          sb.emitOp(node, 'PICKITEM');
          // [arr, val, size - 1]
          sb.emitOp(node, 'ROT');
          // [size - 1, arr, val]
          sb.emitOp(node, 'ROT');
          // [val]
          sb.emitOp(node, 'REMOVE');
        },
      }),
    );

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
