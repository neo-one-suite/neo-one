import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinMemberCall } from '../../BuiltinMemberCall';
import { MemberLikeExpression } from '../../types';

// tslint:disable-next-line export-name
export class AddressIsCaller extends BuiltinMemberCall {
  public emitCall(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
  ): void {
    if (tsUtils.argumented.getArguments(node).length < 1) {
      /* istanbul ignore next */
      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    // [bufferVal]
    sb.visit(tsUtils.argumented.getArguments(node)[0], options);
    // [addressBuffer]
    sb.emitHelper(tsUtils.argumented.getArguments(node)[0], options, sb.helpers.unwrapBuffer);
    // [boolean]
    sb.emitHelper(node, optionsIn, sb.helpers.isCaller);

    if (optionsIn.pushValue) {
      // [booleanVal]
      sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    }
  }
}
