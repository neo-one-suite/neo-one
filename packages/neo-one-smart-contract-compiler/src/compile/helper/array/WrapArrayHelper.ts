import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [arr]
// Output: [objectVal]
export class WrapArrayHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    const invokeArrayConstruct = () => {
      // [Array, argsarr]
      sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: 'Array' }));
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.new());
    };

    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [arr, arr]
          sb.emitOp(node, 'DUP');
          // [size, arr]
          sb.emitOp(node, 'ARRAYSIZE');
          // [1, size, arr]
          sb.emitPushInt(node, 1);
          // [size === 1, arr]
          sb.emitOp(node, 'EQUAL');
        },
        whenTrue: () => {
          // [0, arr]
          sb.emitPushInt(node, 0);
          // [val]
          sb.emitOp(node, 'PICKITEM');
          // [1, val]
          sb.emitPushInt(node, 1);
          // [lengthVal, val]
          sb.emitHelper(node, options, sb.helpers.createNumber);
          // [1, lengthVal, val]
          sb.emitPushInt(node, 1);
          // [argsarr, val]
          sb.emitOp(node, 'PACK');
          // [arrayObjectVal, val]
          invokeArrayConstruct();
          // [arrayObjectVal, val, arrayObjectVal]
          sb.emitOp(node, 'TUCK');
          // [0, arrayObjectVal, val, arrayObjectVal]
          sb.emitPushInt(node, 0);
          // [val, 0, arrayObjectVal, arrayObjectVal]
          sb.emitOp(node, 'ROT');
          // [arrayObjectVal]
          sb.emitHelper(node, options, sb.helpers.setArrayIndex);
        },
        whenFalse: () => {
          // [arrayObjectVal]
          invokeArrayConstruct();
        },
      }),
    );
  }
}
