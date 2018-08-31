import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Types } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinInstanceMemberCall } from '../../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../../types';

// tslint:disable-next-line export-name
export class SetStorageAdd extends BuiltinInstanceMemberCall {
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

    const key = tsUtils.argumented.getArguments(node)[0];
    const keyType = sb.context.analysis.getType(key);

    if (optionsIn.pushValue) {
      // [val, val]
      sb.emitOp(node, 'DUP');
    }
    // [keyVal, val]
    sb.visit(key, options);
    // [value, keyVal, val]
    sb.emitPushBoolean(node, true);
    // []
    sb.emitHelper(node, optionsIn, sb.helpers.setStructuredStorage({ type: Types.SetStorage, keyType }));
  }
}
