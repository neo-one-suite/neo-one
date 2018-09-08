import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Types, WrappableType } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinInstanceMemberCall } from '../../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../../types';

export class ForwardValueAs extends BuiltinInstanceMemberCall {
  public constructor(private readonly type: WrappableType, private readonly isNullable = false) {
    super();
  }

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
      // [val]
      sb.visit(tsUtils.expression.getExpression(func), options);
    }

    const handleValue = () => {
      if (this.type === Types.Array) {
        // [arr]
        sb.emitHelper(
          node,
          options,
          sb.helpers.arrMap({
            map: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.wrapForwardValue);
            },
          }),
        );
      }
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapVal({ type: this.type }));
    };

    // [value]
    sb.emitHelper(node, options, sb.helpers.unwrapForwardValue);
    if (this.isNullable) {
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [value, value]
            sb.emitOp(node, 'DUP');
            // [buffer, value, value]
            sb.emitPushBuffer(node, Buffer.alloc(0, 0));
            // [boolean]
            sb.emitOp(node, 'EQUAL');
          },
          whenTrue: () => {
            // []
            sb.emitOp(node, 'DROP');
            // [val]
            sb.emitHelper(node, options, sb.helpers.wrapUndefined);
          },
          whenFalse: () => {
            // [val]
            handleValue();
          },
        }),
      );
    } else {
      // [val]
      handleValue();
    }

    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
