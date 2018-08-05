import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Types } from '../../helper/types/Types';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInCall, BuiltInType, CallLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ObjectKeys extends BuiltInBase implements BuiltInCall {
  public readonly types = new Set([BuiltInType.Call]);

  public canCall(sb: ScriptBuilder, node: CallLikeExpression): boolean {
    if (!ts.isCallExpression(node)) {
      return false;
    }

    const arg = tsUtils.argumented.getArguments(node)[0] as ts.Expression | undefined;
    if (arg === undefined) {
      return false;
    }

    const type = sb.getType(arg, { error: true });

    return type !== undefined && !tsUtils.type_.hasNull(type) && !tsUtils.type_.hasUndefined(type);
  }

  public emitCall(sb: ScriptBuilder, node: CallLikeExpression, optionsIn: VisitOptions): void {
    if (!ts.isCallExpression(node)) {
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
            sb.emitHelper(node, innerInnerOptions, sb.helpers.createNumber);
            sb.emitHelper(node, innerInnerOptions, sb.helpers.toString({ type: undefined, knownType: Types.Number }));
            sb.emitHelper(node, innerInnerOptions, sb.helpers.createString);
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
            sb.emitHelper(node, innerOptions, sb.helpers.createString);
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
      sb.helpers.forBuiltInType({
        type: sb.getType(arg),
        array: processArray,
        boolean: emptyArray,
        buffer: emptyArray,
        null: throwTypeError,
        number: emptyArray,
        object: processObject,
        string: emptyArray,
        symbol: emptyArray,
        undefined: throwTypeError,
      }),
    );

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
