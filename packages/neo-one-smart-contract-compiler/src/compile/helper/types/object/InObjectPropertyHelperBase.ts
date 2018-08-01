import ts from 'typescript';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [stringProp, objectVal]
// Output: [boolean]
export abstract class InObjectPropertyHelperBase extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.findObjectPropertyBase({
        whenHasProperty: () => {
          // [obj]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          // [true]
          sb.emitPushBoolean(node, true);
        },
        whenNotHasProperty: () => {
          // [obj]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          // [true]
          sb.emitPushBoolean(node, false);
        },
        getObject: this.getObject.bind(this),
      }),
    );
  }

  protected abstract getObject(sb: ScriptBuilder): Helper;
}
