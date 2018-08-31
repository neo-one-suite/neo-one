import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberCall } from '../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class MapGet extends BuiltinInstanceMemberCall {
  public canCall(_sb: ScriptBuilder, _func: CallMemberLikeExpression, node: ts.CallExpression): boolean {
    return tsUtils.argumented.getArguments(node).length === 1;
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

    if (tsUtils.argumented.getArguments(node).length < 1) {
      /* istanbul ignore next */
      return;
    }

    // [map]
    sb.emitHelper(node, options, sb.helpers.unwrapMap);
    // [keyVal, map]
    sb.visit(tsUtils.argumented.getArguments(node)[0], options);
    // [map, keyVal]
    sb.emitOp(node, 'SWAP');
    // [map, keyVal, map]
    sb.emitOp(node, 'TUCK');
    // [keyVal, map, keyVal, map]
    sb.emitOp(node, 'OVER');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [hasKey, keyVal, map]
          sb.emitOp(node, 'HASKEY');
        },
        whenTrue: () => {
          // [val]
          sb.emitOp(node, 'PICKITEM');
        },
        whenFalse: () => {
          // [map]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          // [undefinedVal]
          sb.emitHelper(node, options, sb.helpers.wrapUndefined);
        },
      }),
    );

    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
