import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Types } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinInstanceMemberCall } from '../../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../../types';

// tslint:disable-next-line export-name
export class SetStorageForEach extends BuiltinInstanceMemberCall {
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

    // [objectVal, val]
    sb.visit(tsUtils.argumented.getArguments(node)[0], options);
    // []
    sb.emitHelper(node, optionsIn, sb.helpers.forEachKeyFuncStructuredStorage({ type: Types.SetStorage }));
  }
}
