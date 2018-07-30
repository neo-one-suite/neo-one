import ts from 'typescript';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

export interface SetObjectAccessorPropertyHelperBaseOptions {
  readonly hasSet?: boolean;
  readonly hasGet?: boolean;
}

// Input: [?getObjectVal, ?setObjectVal, stringProp, objectVal]
// Output: []
export abstract class SetObjectAccessorPropertyHelperBase extends Helper {
  private readonly hasSet: boolean;
  private readonly hasGet: boolean;

  public constructor({ hasSet = false, hasGet = false }: SetObjectAccessorPropertyHelperBaseOptions) {
    super();
    this.hasSet = hasSet;
    this.hasGet = hasGet;

    if (!(this.hasSet || this.hasGet)) {
      throw new Error('Something went wrong. Must have either a getter or setter');
    }
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
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

  protected abstract getObject(sb: ScriptBuilder): Helper;
}
