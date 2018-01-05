import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import {
  FuncProperty,
  InternalFunctionProperties,
} from './InternalFunctionProperties';

export interface CloneSingleFunctionHelperOptions {
  type: 'single';
  property: FuncProperty;
}
export interface CloneBothFunctionHelperOptions {
  type: 'both';
}

export type CloneFunctionObjectHelperOptions =
  | CloneSingleFunctionHelperOptions
  | CloneBothFunctionHelperOptions;

// Input: [objectVal]
// Output: [objectVal]
export class CloneFunctionObjectHelper extends Helper {
  private property: FuncProperty;
  private both: boolean;

  constructor(options: CloneFunctionObjectHelperOptions) {
    super();
    if (options.type === 'both') {
      this.property = InternalFunctionProperties.CALL;
      this.both = true;
    } else {
      this.property = options.property;
      this.both = false;
    }
  }

  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.shallowCloneObject);

    if (this.both) {
      // [objectVal]
      this.cloneFunction(sb, node, options, InternalFunctionProperties.CALL);
      // [objectVal]
      this.cloneFunction(
        sb,
        node,
        options,
        InternalFunctionProperties.CONSTRUCT,
      );
    } else {
      // [objectVal]
      this.cloneFunction(sb, node, options, this.property);
    }
  }

  public cloneFunction(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    property: FuncProperty,
  ): void {
    // [objectVal, objectVal]
    sb.emitOp(node, 'DUP');
    // [property, objectVal, objectVal]
    sb.emitPushString(node, property);
    // [func, objectVal]
    sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
    // [func, objectVal]
    sb.emitHelper(node, options, sb.helpers.cloneFunction);
    // [objectVal, func, objectVal]
    sb.emitOp(node, 'OVER');
    // [property, objectVal, func, objectVal]
    sb.emitPushString(node, property);
    // [func, property, objectVal, objectVal]
    sb.emitOp(node, 'ROT');
    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }
}
