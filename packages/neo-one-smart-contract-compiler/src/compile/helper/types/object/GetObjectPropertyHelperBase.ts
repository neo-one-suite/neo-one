import ts from 'typescript';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [stringProp, objectVal]
// Output: [val]
export abstract class GetObjectPropertyHelperBase extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [objectVal, stringProp, objectVal]
    sb.emitOp(node, 'OVER');
    // [stringProp, objectVal, objectVal]
    sb.emitOp(node, 'SWAP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.findObjectProperty({
        accessor: () => {
          // [0, propVal, objectVal]
          sb.emitPushInt(node, 0);
          // [getObjectVal, objectVal]
          sb.emitOp(node, 'PICKITEM');
          // [val]
          sb.emitHelper(node, options, sb.helpers.invokeCall({ bindThis: true, noArgs: true }));
        },
        dataExists: () => {
          // [propVal]
          sb.emitOp(node, 'NIP');
          if (options.pushValue) {
            // [0, propVal]
            sb.emitPushInt(node, 0);
            // [val]
            sb.emitOp(node, 'PICKITEM');
          } else {
            // []
            sb.emitOp(node, 'DROP');
          }
        },
        data: () => {
          // []
          sb.emitOp(node, 'DROP');
          if (options.pushValue) {
            // [val]
            sb.emitHelper(node, options, sb.helpers.createUndefined);
          }
        },
        getObject: this.getObject.bind(this),
      }),
    );
  }

  protected abstract getObject(sb: ScriptBuilder): Helper;
}
