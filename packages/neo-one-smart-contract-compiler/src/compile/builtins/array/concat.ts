import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberCall } from '../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ArrayConcat extends BuiltinInstanceMemberCall {
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
      // [arrayVal]
      sb.visit(tsUtils.expression.getExpression(func), options);
    }

    const handleArray = (innerOptions: VisitOptions) => {
      // [arr]
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapArray);
    };

    const handleOther = () => {
      // [number, val]
      sb.emitPushInt(node, 0);
      // [arr, val]
      sb.emitOp(node, 'NEWARRAY');
      // [arr, val, arr]
      sb.emitOp(node, 'TUCK');
      // [val, arr, arr]
      sb.emitOp(node, 'SWAP');
      // [arr]
      sb.emitOp(node, 'APPEND');
    };

    // [arr]
    sb.emitHelper(node, options, sb.helpers.unwrapArray);
    // [arr]
    sb.emitHelper(node, options, sb.helpers.cloneArray);
    tsUtils.argumented.getArguments(node).forEach((arg) => {
      // [val, arr]
      sb.visit(arg, options);
      // [arr, arr]
      sb.emitHelper(
        node,
        options,
        sb.helpers.forBuiltinType({
          type: sb.context.analysis.getType(arg),
          array: handleArray,
          arrayStorage: handleOther,
          boolean: handleOther,
          buffer: handleOther,
          null: handleOther,
          number: handleOther,
          object: handleOther,
          string: handleOther,
          symbol: handleOther,
          undefined: handleOther,
          map: handleOther,
          mapStorage: handleOther,
          set: handleOther,
          setStorage: handleOther,
          error: handleOther,
          forwardValue: handleOther,
          iteratorResult: handleOther,
          iterable: handleOther,
          iterableIterator: handleOther,
          transaction: handleOther,
          output: handleOther,
          attribute: handleOther,
          input: handleOther,
          account: handleOther,
          asset: handleOther,
          contract: handleOther,
          header: handleOther,
          block: handleOther,
        }),
      );
      // [arr]
      sb.emitHelper(node, options, sb.helpers.arrConcat);
    });
    if (optionsIn.pushValue) {
      // [arrayVal]
      sb.emitHelper(node, options, sb.helpers.wrapArray);
    } else {
      sb.emitOp(node, 'DROP');
    }
  }
}
