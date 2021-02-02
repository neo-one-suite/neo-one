import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface NewHelperOptions {
  readonly noArgs?: boolean;
}

// Input: [objectVal, ?argsarr]
// Output: [thisVal]
export class NewHelper extends Helper {
  private readonly noArgs: boolean;

  public constructor(options: NewHelperOptions = { noArgs: false }) {
    super();
    this.noArgs = options.noArgs || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [thisVal, objectVal, ?argsarr]
    sb.emitHelper(node, options, sb.helpers.createObject);
    if (this.noArgs) {
      // [thisVal, objectVal, thisVal]
      sb.emitOp(node, 'TUCK');
    } else {
      // [thisVal, thisVal, objectVal, argsarr]
      sb.emitOp(node, 'DUP');
      // [argsarr, objectVal, thisVal, thisVal]
      sb.emitOp(node, 'REVERSE4');
      // [thisVal, objectVal, argsarr, thisVal]
      sb.emitOp(node, 'REVERSE3');
    }
    // [thisVal, objectVal, thisVal, ?argsarr, thisVal]
    sb.emitOp(node, 'TUCK');
    // [objectVal, thisVal, objectVal, thisVal, ?argsarr, thisVal]
    sb.emitOp(node, 'OVER');
    // ['__proto__', objectVal, thisVal, objectVal, thisVal, ?argsarr, thisVal]
    sb.emitPushString(node, '__proto__');
    // [objectVal, '__proto__', thisVal, objectVal, thisVal, ?argsarr, thisVal]
    sb.emitOp(node, 'SWAP');
    // ['prototype', objectVal, '__proto__', thisVal, objectVal, thisVal, ?argsarr, thisVal]
    sb.emitPushString(node, 'prototype');
    // [prototype, '__proto__', thisVal, objectVal, thisVal, ?argsarr, thisVal]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
    // [objectVal, thisVal, ?argsarr, thisVal]
    sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
    // [thisVal]
    sb.emitHelper(node, sb.noPushValueOptions(options), sb.helpers.invokeConstruct({ noArgs: this.noArgs }));

    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
