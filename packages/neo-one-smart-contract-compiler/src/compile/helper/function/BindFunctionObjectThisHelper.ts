import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import {
  FuncProperty,
  InternalFunctionProperties,
} from './InternalFunctionProperties';

// Input: [objectVal, this]
// Output: [objectVal]
export interface BindSingleFunctionHelperOptions {
  type: 'single';
  property: FuncProperty;
  overwrite: boolean;
}
export interface BindBothFunctionHelperOptions {
  type: 'both';
  overwrite: boolean;
}

export type BindFunctionObjectThisHelperOptions =
  | BindSingleFunctionHelperOptions
  | BindBothFunctionHelperOptions;

// Input: [objectVal, this]
// Output: [objectVal]
export class BindFunctionObjectThisHelper extends Helper {
  private property: FuncProperty;
  private both: boolean;
  private overwrite: boolean;

  constructor(options: BindFunctionObjectThisHelperOptions) {
    super();
    if (options.type === 'both') {
      this.property = InternalFunctionProperties.CALL;
      this.both = true;
    } else {
      this.property = options.property;
      this.both = false;
    }
    this.overwrite = options.overwrite;
  }

  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    // [objectVal, this]
    sb.emitHelper(
      node,
      options,
      sb.helpers.cloneFunctionObject(
        this.both
          ? { type: 'both' }
          : { type: 'single', property: this.property },
      ),
    );
    // [this, objectVal]
    sb.emitOp(node, 'SWAP');

    if (this.both) {
      this.bindThis(sb, node, options, InternalFunctionProperties.CALL);
      this.bindThis(sb, node, options, InternalFunctionProperties.CONSTRUCT);
    } else {
      this.bindThis(sb, node, options, this.property);
    }

    sb.emitOp(node, 'DROP');
  }

  private bindThis(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    property: FuncProperty,
  ): void {
    // [this, objectVal, this]
    sb.emitOp(node, 'TUCK');
    // [objectVal, this, objectVal, this]
    sb.emitOp(node, 'OVER');
    // [property, objectVal, this, objectVal, this]
    sb.emitPushString(node, property);
    // [func, this, objectVal, this]
    sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
    // [func, objectVal, this]
    sb.emitHelper(
      node,
      options,
      sb.helpers.bindFunctionThis({ overwrite: this.overwrite }),
    );
    // [objectVal, this]
    sb.emitOp(node, 'DROP');
    // [this, objectVal]
    sb.emitOp(node, 'SWAP');
  }
}
