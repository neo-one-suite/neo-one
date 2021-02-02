import ts from 'typescript';
import { ErrorSlots } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [errorVal]
// Output: []
export class ThrowHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [errorVal, errorVal]
    sb.emitOp(node, 'DUP');
    // [stringVal, errorVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [errorVal, errorVal, errorVal]
          sb.emitOp(node, 'DUP');
          // [boolean, errorVal, errorVal]
          sb.emitHelper(node, options, sb.helpers.isString);
        },
        whenFalse: () => {
          // [map, errorVal]
          sb.emitHelper(node, options, sb.helpers.unwrapError);
          // [number, map, errorVal]
          sb.emitPushInt(node, ErrorSlots.message);
          // [stringVal, errorVal]
          sb.emitOp(node, 'PICKITEM');
        },
      }),
    );
    // [string, errorVal]
    sb.emitHelper(node, options, sb.helpers.unwrapString);
    // [number, string, errorVal]
    sb.emitLine(node);
    // [string, number, errorVal]
    sb.emitOp(node, 'SWAP');
    // ['error', string, number, errorVal]
    sb.emitPushString(node, 'error');
    // [3, 'error', number, string, errorVal]
    sb.emitPushInt(node, 3);
    // [array, errorVal]
    sb.emitOp(node, 'PACK');
    // ['error', array, errorVal]
    sb.emitPushString(node, 'error');
    // [errorVal]
    sb.emitSysCall(node, 'System.Runtime.Notify');
    // []
    sb.emitHelper(node, optionsIn, sb.helpers.throwCompletion);
  }
}
