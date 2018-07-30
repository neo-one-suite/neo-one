import ts from 'typescript';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

export interface FindObjectPropertyHelperOptions {
  readonly accessor: () => void;
  readonly dataExists: () => void;
  readonly data: () => void;
  readonly getObject: (sb: ScriptBuilder) => Helper;
}

// Input: [stringProp, objectVal]
// Output: [val]
export class FindObjectPropertyHelper extends Helper {
  private readonly accessor: () => void;
  private readonly dataExists: () => void;
  private readonly data: () => void;
  private readonly getObject: (sb: ScriptBuilder) => Helper;

  public constructor({ accessor, dataExists, data, getObject }: FindObjectPropertyHelperOptions) {
    super();
    this.accessor = accessor;
    this.dataExists = dataExists;
    this.data = data;
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
          // ['prototype', pobj, notHasKey, obj, pobj, prop]
          sb.emitPushString(node, 'prototype');
          // [hasPrototypeKey, notHasKey, obj, pobj, prop]
          sb.emitOp(node, 'HASKEY');
          // [condition, obj, pobj, prop]
          sb.emitOp(node, 'AND');
        },
        each: () => {
          // [pobj, prop]
          sb.emitOp(node, 'DROP');
          // ['prototype', pobj, prop]
          sb.emitPushString(node, 'prototype');
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
          // [propVal]
          sb.emitOp(node, 'PICKITEM');
          // [propVal, propVal]
          sb.emitOp(node, 'DUP');
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [size, propVal]
                sb.emitOp(node, 'ARRAYSIZE');
                // [2, size, propVal]
                sb.emitPushInt(node, 2);
                // [size === 2, propVal]
                sb.emitOp(node, 'EQUAL');
              },
              whenTrue: () => {
                this.accessor();
              },
              whenFalse: () => {
                this.dataExists();
              },
            }),
          );
        },
        whenFalse: () => {
          // [obj]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          this.data();
        },
      }),
    );
  }
}
