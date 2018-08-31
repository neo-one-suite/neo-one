import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Types } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinInstanceMemberCall } from '../../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../../types';

// tslint:disable-next-line export-name
export class ArrayStoragePush extends BuiltinInstanceMemberCall {
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

    // [val, val]
    sb.emitOp(node, 'DUP');
    // [idx, val]
    sb.emitHelper(node, options, sb.helpers.getArrayStorageLength);
    tsUtils.argumented.getArguments(node).forEach((arg) => {
      // [val, idx]
      sb.emitOp(node, 'SWAP');
      // [val, idx, val]
      sb.emitOp(node, 'TUCK');
      // [idx, val, idx, val]
      sb.emitOp(node, 'OVER');
      // [idxVal, val, idx, val]
      sb.emitHelper(node, options, sb.helpers.wrapNumber);
      // [valueVal, idxVal, val, idx, val]
      sb.visit(arg, options);
      // [idx, val]
      sb.emitHelper(
        node,
        optionsIn,
        sb.helpers.setStructuredStorage({ type: Types.ArrayStorage, keyType: undefined, knownKeyType: Types.Number }),
      );
      // [idx, val]
      sb.emitOp(node, 'INC');
    });
    if (optionsIn.pushValue) {
      // [idx, val, idx]
      sb.emitOp(node, 'TUCK');
    }
    // [idx]
    sb.emitHelper(node, options, sb.helpers.putArrayStorageLength);
    if (optionsIn.pushValue) {
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapNumber);
    }
  }
}
