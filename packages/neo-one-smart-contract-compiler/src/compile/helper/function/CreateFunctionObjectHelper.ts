import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { FuncProperty } from './InternalFunctionProperties';

export interface CreateFunctionObjectHelperOptions {
  readonly property: FuncProperty;
}

// Input: [farr]
// Output: [objectVal]
export class CreateFunctionObjectHelper extends Helper {
  private readonly property: FuncProperty;

  public constructor({ property }: CreateFunctionObjectHelperOptions) {
    super();
    this.property = property;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [objectVal, farr]
      sb.emitHelper(node, options, sb.helpers.createObject);
      // [objectVal, farr, objectVal]
      sb.emitOp(node, 'TUCK');
      // ['call', objectVal, farr, objectVal]
      sb.emitPushString(node, this.property);
      // [farr, 'call', objectVal, objectVal]
      sb.emitOp(node, 'ROT');
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
    }
  }
}
