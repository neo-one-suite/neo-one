import ts from 'typescript';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

export interface FindObjectPropertyHelperBaseOptions {
  readonly whenHasProperty: () => void;
  readonly whenNotHasProperty: () => void;
  readonly getObject: (sb: ScriptBuilder) => Helper;
}

// Input: [stringProp, objectVal]
export class FindObjectPropertyHelperBase extends Helper {
  private readonly whenHasProperty: () => void;
  private readonly whenNotHasProperty: () => void;
  private readonly getObject: (sb: ScriptBuilder) => Helper;

  public constructor({ whenHasProperty, whenNotHasProperty, getObject }: FindObjectPropertyHelperBaseOptions) {
    super();
    this.whenHasProperty = whenHasProperty;
    this.whenNotHasProperty = whenNotHasProperty;
    this.getObject = getObject;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    // [objectVal, prop]
    sb.emitOp(node, 'SWAP');

    const prepareLoop = () => {
      // [objectVal, objectVal, prop]
      sb.emitOp(node, 'DUP');
      // [pobj, objectVal, prop]
      sb.emitHelper(node, options, sb.helpers.getPropertyObject);
      // [pobj, pobj, objectVal, prop]
      sb.emitOp(node, 'DUP');
      // [objectVal, pobj, pobj, prop]
      sb.emitOp(node, 'ROT');
      // [obj, pobj, pobj, prop]
      sb.emitHelper(node, options, this.getObject(sb));
      // [obj, obj, pobj, pobj, prop]
      sb.emitOp(node, 'DUP');
      // [4, obj, obj, pobj, pobj, prop]
      sb.emitPushInt(node, 4);
      // [prop, obj, obj, pobj, pobj, prop]
      sb.emitOp(node, 'PICK');
    };

    // [prop, obj, obj, pobj, pobj, prop]
    prepareLoop();

    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [hasKey, obj, pobj, pobj, prop]
          sb.emitOp(node, 'HASKEY');
          // [notHasKey, obj, pobj, pobj, prop]
          sb.emitOp(node, 'NOT');
          // [pobj, notHasKey, obj, pobj, prop]
          sb.emitOp(node, 'ROT');
          // ['__proto__', pobj, notHasKey, obj, pobj, prop]
          sb.emitPushString(node, '__proto__');
          // [hasPrototypeKey, notHasKey, obj, pobj, prop]
          sb.emitOp(node, 'HASKEY');
          // [condition, obj, pobj, prop]
          sb.emitOp(node, 'AND');
        },
        each: () => {
          // [pobj, prop]
          sb.emitOp(node, 'DROP');
          // ['__proto__', pobj, prop]
          sb.emitPushString(node, '__proto__');
          // [propVal, prop]
          sb.emitOp(node, 'PICKITEM');
          // [0, propVal, prop]
          sb.emitPushInt(node, 0);
          // [objectVal, prop]
          sb.emitOp(node, 'PICKITEM');
          // [prop, obj, obj, pobj, pobj, prop]
          prepareLoop();
        },
        withScope: false,
      }),
    );
    // [obj, prop]
    sb.emitOp(node, 'NIP');
    // [obj, prop, obj]
    sb.emitOp(node, 'TUCK');
    // [prop, obj, prop, obj]
    sb.emitOp(node, 'OVER');
    // [val]
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [hasKey, prop, obj]
          sb.emitOp(node, 'HASKEY');
        },
        whenTrue: () => {
          this.whenHasProperty();
        },
        whenFalse: () => {
          this.whenNotHasProperty();
        },
      }),
    );
  }
}
