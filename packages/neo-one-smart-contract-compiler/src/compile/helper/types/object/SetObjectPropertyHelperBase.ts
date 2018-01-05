import { Node } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

// Input: [val, stringProp, objectVal]
// Output: [val]
export abstract class SetObjectPropertyHelperBase extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    // [objectVal, val, stringProp]
    sb.emitOp(node, 'ROT');
    // [stringProp, objectVal, val]
    sb.emitOp(node, 'ROT');
    // [stringProp, objectVal, stringProp, val]
    sb.emitOp(node, 'TUCK');
    // [objectVal, stringProp, objectVal, stringProp, val]
    sb.emitOp(node, 'OVER');
    // [stringProp, objectVal, objectVal, stringProp, val]
    sb.emitOp(node, 'SWAP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.findObjectProperty({
        accessor: () => {
          // [1, propVal, objectVal, stringProp, val]
          sb.emitPushInt(node, 1);
          // [setObjectVal, objectVal, stringProp, val]
          sb.emitOp(node, 'PICKITEM');
          // [stringProp, setObjectVal, objectVal, val]
          sb.emitOp(node, 'ROT');
          // [setObjectVal, objectVal, val]
          sb.emitOp(node, 'DROP');
          // [val, setObjectVal, objectVal]
          sb.emitOp(node, 'ROT');
          // [1, val, setObjectVal, objectVal]
          sb.emitPushInt(node, 1);
          // [argsarr, setObjectVal, objectVal]
          sb.emitOp(node, 'PACK');
          // [objectVal, argsarr, setObjectVal]
          sb.emitOp(node, 'ROT');
          // [setObjectVal, objectVal, argsarr]
          sb.emitOp(node, 'ROT');
          // [val]
          sb.emitHelper(
            node,
            options,
            sb.helpers.invokeCall({ bindThis: true, noArgs: false }),
          );
        },
        dataExists: () => {
          // [propVal, stringProp, val]
          sb.emitOp(node, 'NIP');
          // [propVal, val]
          sb.emitOp(node, 'NIP');
          // [0, propVal, val]
          sb.emitPushInt(node, 0);
          // [val, 0, propVal]
          sb.emitOp(node, 'ROT');
          // []
          sb.emitOp(node, 'SETITEM');
        },
        data: () => {
          // [stringProp, objectVal, val]
          sb.emitOp(node, 'SWAP');
          // [val, stringProp, objectVal]
          sb.emitOp(node, 'ROT');
          // []
          sb.emitHelper(node, options, this.setDataProperty(sb));
        },
        getObject: this.getObject.bind(this),
      }),
    );
  }

  protected abstract getObject(sb: ScriptBuilder): Helper<Node>;
  protected abstract setDataProperty(sb: ScriptBuilder): Helper<Node>;
}
