import ts from 'typescript';
import { InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface CloneSingleFunctionHelperOptions {
  readonly type: 'single';
  readonly property: InternalObjectProperty;
}
export interface CloneBothFunctionHelperOptions {
  readonly type: 'both';
}

export type CloneFunctionObjectHelperOptions = CloneSingleFunctionHelperOptions | CloneBothFunctionHelperOptions;

// Input: [objectVal]
// Output: [objectVal]
export class CloneFunctionObjectHelper extends Helper {
  private readonly property: InternalObjectProperty;
  private readonly both: boolean;

  public constructor(options: CloneFunctionObjectHelperOptions) {
    super();
    if (options.type === 'both') {
      this.property = InternalObjectProperty.Call;
      this.both = true;
    } else {
      this.property = options.property;
      this.both = false;
    }
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.shallowCloneObject);

    if (this.both) {
      // [objectVal]
      this.cloneFunction(sb, node, options, InternalObjectProperty.Call);
      // [objectVal]
      this.cloneFunction(sb, node, options, InternalObjectProperty.Construct);
    } else {
      // [objectVal]
      this.cloneFunction(sb, node, options, this.property);
    }
  }

  public cloneFunction(
    sb: ScriptBuilder,
    node: ts.Node,
    options: VisitOptions,
    property: InternalObjectProperty,
  ): void {
    // [objectVal, objectVal]
    sb.emitOp(node, 'DUP');
    // [property, objectVal, objectVal]
    sb.emitPushInt(node, property);
    // [func, objectVal]
    sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
    // [func, objectVal]
    sb.emitHelper(node, options, sb.helpers.cloneFunction);
    // [objectVal, func, objectVal]
    sb.emitOp(node, 'OVER');
    // [property, objectVal, func, objectVal]
    sb.emitPushInt(node, property);
    // [func, property, objectVal, objectVal]
    sb.emitOp(node, 'ROT');
    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }
}
