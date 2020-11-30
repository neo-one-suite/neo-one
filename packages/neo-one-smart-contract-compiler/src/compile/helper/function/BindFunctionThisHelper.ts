import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface BindFunctionThisHelperOptions {
  readonly overwrite: boolean;
}

// Input: [func, this]
// Output: [func]
export class BindFunctionThisHelper extends Helper {
  private readonly overwrite: boolean;

  public constructor(options: BindFunctionThisHelperOptions) {
    super();
    this.overwrite = options.overwrite;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    let whenTrue;
    if (this.overwrite) {
      whenTrue = () => {
        // [this, func, func]
        sb.emitOp(node, 'SWAP');
        // [2, this, func, func]
        sb.emitPushInt(node, 2);
        // [func]
        sb.emitOp(node, 'SETITEM');
      };
    } else {
      whenTrue = () => {
        // [this, func]
        sb.emitOp(node, 'DROP');
        // [func]
        sb.emitOp(node, 'DROP');
      };
    }

    // [func, this]
    sb.emitHelper(node, options, sb.helpers.cloneFunction);
    // [func, this, func]
    sb.emitOp(node, 'TUCK');
    // [func, func, this, func]
    sb.emitOp(node, 'DUP');
    // [func]
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [size, func, this, func]
          sb.emitOp(node, 'SIZE');
          // [3, size, func, this, func]
          sb.emitPushInt(node, 3);
          // [hasThis, func, this, func]
          sb.emitOp(node, 'NUMEQUAL');
        },
        whenTrue,
        whenFalse: () => {
          // [this, func, func]
          sb.emitOp(node, 'SWAP');
          // [func]
          sb.emitOp(node, 'APPEND');
        },
      }),
    );
  }
}
