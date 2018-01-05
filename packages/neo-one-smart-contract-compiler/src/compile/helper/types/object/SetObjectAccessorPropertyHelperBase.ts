import { Node } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

export interface SetObjectAccessorPropertyHelperBaseOptions {
  hasSet?: boolean;
  hasGet?: boolean;
}

// Input: [?getObjectVal, ?setObjectVal, stringProp, objectVal]
// Output: []
export abstract class SetObjectAccessorPropertyHelperBase extends Helper<Node> {
  private readonly hasSet: boolean;
  private readonly hasGet: boolean;

  constructor({ hasSet, hasGet }: SetObjectAccessorPropertyHelperBaseOptions) {
    super();
    this.hasSet = hasSet == null ? false : hasSet;
    this.hasGet = hasGet == null ? false : hasGet;

    if (!(this.hasSet || this.hasGet)) {
      throw new Error(
        'Something went wrong. Must have either a getter or setter',
      );
    }
  }

  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    if (!(this.hasSet && this.hasGet)) {
      // [val, ?getObjectVal, ?setObjectVal, stringProp, objectVal]
      sb.emitHelper(node, options, sb.helpers.createUndefined);
      if (this.hasGet) {
        // [getObjectVal, setObjectVal, stringProp, objectVal]
        sb.emitOp(node, 'SWAP');
      }
    }
    // [2, getObjectVal, setObjectVal, stringProp, objectVal]
    sb.emitPushInt(node, 2);
    // [val, stringProp, objectVal]
    sb.emitOp(node, 'PACK');
    // [objectVal, val, stringProp]
    sb.emitOp(node, 'ROT');
    // [obj, val, stringProp]
    sb.emitHelper(node, options, this.getObject(sb));
    // [stringProp, obj, val]
    sb.emitOp(node, 'ROT');
    // [val, stringProp, obj]
    sb.emitOp(node, 'ROT');
    // []
    sb.emitOp(node, 'SETITEM');
  }

  protected abstract getObject(sb: ScriptBuilder): Helper<Node>;
}
