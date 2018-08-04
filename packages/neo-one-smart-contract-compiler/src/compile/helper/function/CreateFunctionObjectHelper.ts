import ts from 'typescript';
import { InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface CreateFunctionObjectHelperOptions {
  readonly property: InternalObjectProperty;
}

// Input: [farr]
// Output: [objectVal]
export class CreateFunctionObjectHelper extends Helper {
  private readonly property: InternalObjectProperty;

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
      // [number, objectVal, farr, objectVal]
      sb.emitPushInt(node, this.property);
      // [farr, 'call', objectVal, objectVal]
      sb.emitOp(node, 'ROT');
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
    }
  }
}
