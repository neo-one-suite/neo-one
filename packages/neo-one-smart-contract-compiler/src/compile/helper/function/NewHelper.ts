import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

export interface NewHelperOptions {
  noArgs?: boolean;
}

// Input: [objectVal, ?argsarr]
// Output: [thisVal]
export class NewHelper extends Helper {
  private noArgs: boolean;

  constructor(options: NewHelperOptions = { noArgs: false }) {
    super();
    this.noArgs = options.noArgs || false;
  }

  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [thisVal, objectVal, ?argsarr]
    sb.emitHelper(node, options, sb.helpers.createObject);
    if (this.noArgs) {
      // [thisVal, objectVal, thisVal]
      sb.emitOp(node, 'TUCK');
    } else {
      // [3, thisVal, objectVal, argsarr]
      sb.emitPushInt(node, 3);
      // [thisVal, objectVal, argsarr, thisVal]
      sb.emitOp(node, 'XTUCK');
    }
    // [thisVal, objectVal, thisVal, ?argsarr, thisVal]
    sb.emitOp(node, 'TUCK');
    // [objectVal, thisVal, objectVal, thisVal, ?argsarr, thisVal]
    sb.emitOp(node, 'OVER');
    // ['prototype', objectVal, thisVal, objectVal, thisVal, ?argsarr, thisVal]
    sb.emitPushString(node, 'prototype');
    // [objectVal, 'prototype', thisVal, objectVal, thisVal, ?argsarr, thisVal]
    sb.emitOp(node, 'SWAP');
    // ['prototype', objectVal, 'prototype', thisVal, objectVal, thisVal, ?argsarr, thisVal]
    sb.emitPushString(node, 'prototype');
    // [prototype, 'prototype', thisVal, objectVal, thisVal, ?argsarr, thisVal]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
    // [objectVal, thisVal, ?argsarr, thisVal]
    sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
    // [thisVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.invokeConstruct({ noArgs: this.noArgs }),
    );

    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
