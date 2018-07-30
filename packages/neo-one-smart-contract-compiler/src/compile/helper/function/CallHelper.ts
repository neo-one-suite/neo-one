import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export class CallHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // Push the scopes and this to the alt stack
    // [func, func]
    sb.emitOp(node, 'DUP');
    // [1, func, func]
    sb.emitPushInt(node, 1);
    // [[scopes, this], func]
    sb.emitOp(node, 'PICKITEM');
    // [[scopes, this], func]
    sb.emitHelper(node, options, sb.helpers.cloneArray);
    // [[scopes, this], [scopes, this], func]
    sb.emitOp(node, 'DUP');
    // [0, [scopes, this], [scopes, this], func]
    sb.emitPushInt(node, 0);
    // [[scopes, this], 0, [scopes, this], [scopes, this], func]
    sb.emitOp(node, 'OVER');
    // [0, [scopes, this], 0, [scopes, this], [scopes, this], func]
    sb.emitPushInt(node, 0);
    // [scopes, 0, [scopes, this], [scopes, this], func]
    sb.emitOp(node, 'PICKITEM');
    // [scopes, 0, [scopes, this], [scopes, this], func]
    sb.emitHelper(node, options, sb.helpers.cloneArray);
    // [[scopes, this], func]
    sb.emitOp(node, 'SETITEM');
    // [func, [scopes, this], func]
    sb.emitOp(node, 'OVER');
    // [[scopes, this], func]
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [size, [scopes, this], func]
          sb.emitOp(node, 'ARRAYSIZE');
          // [3, size, [scopes, this], func]
          sb.emitPushInt(node, 3);
          // [size === 3, [scopes, this], func]
          sb.emitOp(node, 'NUMEQUAL');
        },
        whenTrue: () => {
          // [func, [scopes, this], func]
          sb.emitOp(node, 'OVER');
          // [2, func, [scopes, this], func]
          sb.emitPushInt(node, 2);
          // [this, [scopes, this], func]
          sb.emitOp(node, 'PICKITEM');
          // [[scopes, this], this, [scopes, this], func]
          sb.emitOp(node, 'OVER');
          // [1, [scopes, this], this, [scopes, this], func]
          sb.emitPushInt(node, 1);
          // [this, 1, [scopes, this], [scopes, this], func]
          sb.emitOp(node, 'ROT');
          // [[scopes, this], func]
          sb.emitOp(node, 'SETITEM');
        },
      }),
    );

    // [func]
    sb.emitOp(node, 'TOALTSTACK');

    // Push the target on the stack
    // [0, func]
    sb.emitPushInt(node, 0);
    // [target]
    sb.emitOp(node, 'PICKITEM');

    // Call function
    sb.emitCall(node);

    // Remove scope
    sb.emitOp(node, 'FROMALTSTACK');
    sb.emitOp(node, 'DROP');

    if (optionsIn.pushValue) {
      sb.emitOp(node, 'DUP');
    }
    sb.emitHelper(node, options, sb.helpers.handleCompletion);
    if (optionsIn.pushValue) {
      sb.emitHelper(node, options, sb.helpers.getCompletionVal);
    }
  }
}
