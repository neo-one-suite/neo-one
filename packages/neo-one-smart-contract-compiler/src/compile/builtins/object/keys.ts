import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Types } from '../../helper/types/Types';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinMemberCall } from '../BuiltinMemberCall';
import { MemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ObjectKeys extends BuiltinMemberCall {
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
    const arg = tsUtils.argumented.getArguments(node)[0];

    const processArray = (innerOptions: VisitOptions) => {
      // [arr]
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapArray);
      // [number]
      sb.emitOp(node, 'ARRAYSIZE');
      // [arr]
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.arrRange({
          map: (innerInnerOptions) => {
            sb.emitHelper(node, innerInnerOptions, sb.helpers.wrapNumber);
            sb.emitHelper(node, innerInnerOptions, sb.helpers.toString({ type: undefined, knownType: Types.Number }));
            sb.emitHelper(node, innerInnerOptions, sb.helpers.wrapString);
          },
        }),
      );
      // [arrayVal]
      sb.emitHelper(node, innerOptions, sb.helpers.wrapArray);
    };

    const emptyArray = (innerOptions: VisitOptions) => {
      // []
      sb.emitOp(node, 'DROP');
      // [arrayVal]
      sb.emitHelper(node, innerOptions, sb.helpers.createArray);
    };

    const throwTypeError = (innerOptions: VisitOptions) => {
      sb.emitOp(node, 'DROP');
      sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
    };

    const processObject = (innerOptions: VisitOptions) => {
      // [arr]
      sb.emitHelper(node, innerOptions, sb.helpers.getPropertyObjectKeys);
      // [arr]
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.arrMap({
          map: () => {
            // [val]
            sb.emitHelper(node, innerOptions, sb.helpers.wrapString);
          },
        }),
      );
      // [arrayVal]
      sb.emitHelper(node, innerOptions, sb.helpers.wrapArray);
    };

    // [val]
    sb.visit(arg, options);
    // [objectVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: sb.context.getType(arg),
        array: processArray,
        boolean: emptyArray,
        buffer: emptyArray,
        null: throwTypeError,
        number: emptyArray,
        object: processObject,
        string: emptyArray,
        symbol: emptyArray,
        undefined: throwTypeError,
        transaction: emptyArray,
        output: emptyArray,
        attribute: emptyArray,
        input: emptyArray,
        account: emptyArray,
        asset: emptyArray,
        contract: emptyArray,
        header: emptyArray,
        block: emptyArray,
      }),
    );

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
