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

    sb.emitHelper(
      node,
      options,
      sb.helpers.findObjectPropertyBase({
        whenHasProperty: () => {
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
                sb.emitOp(node, 'SIZE');
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
        whenNotHasProperty: () => {
          // [obj]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          this.data();
        },
        getObject: this.getObject,
      }),
    );
  }
}
