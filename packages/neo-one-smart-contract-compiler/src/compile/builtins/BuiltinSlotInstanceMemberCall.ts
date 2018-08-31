import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { WrappableType } from '../constants';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinInstanceMemberCall } from './BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from './types';

export class BuiltinSlotInstanceMemberCall extends BuiltinInstanceMemberCall {
  public constructor(private readonly type: WrappableType, private readonly slot: number) {
    super();
  }

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
      // [val]
      sb.visit(tsUtils.expression.getExpression(func), options);
    }

    // [map]
    sb.emitHelper(node, options, sb.helpers.unwrapVal({ type: this.type }));
    // [number, map]
    sb.emitPushInt(node, this.slot);
    // [callable]
    sb.emitOp(node, 'PICKITEM');
    // [0, callable]
    sb.emitPushInt(node, 0);
    // [argsarr, callable]
    sb.emitOp(node, 'NEWARRAY');
    // [callable, argsarr]
    sb.emitOp(node, 'SWAP');
    // [val]
    sb.emitHelper(node, optionsIn, sb.helpers.call);
  }
}
