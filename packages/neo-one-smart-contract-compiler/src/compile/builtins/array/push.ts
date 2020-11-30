import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberCall } from '../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ArrayPush extends BuiltinInstanceMemberCall {
  protected readonly isReadonly = false;

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
    tsUtils.argumented.getArguments(node).forEach((arg) => {
      // [arr, arr]
      sb.emitOp(node, 'DUP');
      // [val, arr, arr]
      sb.visit(arg, options);
      // [arr]
      sb.emitOp(node, 'APPEND');
    });
    // [number]
    sb.emitOp(node, 'SIZE');
    if (optionsIn.pushValue) {
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapNumber);
    } else {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
