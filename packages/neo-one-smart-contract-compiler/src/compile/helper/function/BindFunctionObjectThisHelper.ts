import ts from 'typescript';
import { InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [objectVal, this]
// Output: [objectVal]
export interface BindSingleFunctionHelperOptions {
  readonly type: 'single';
  readonly property: InternalObjectProperty;
  readonly overwrite: boolean;
}
export interface BindBothFunctionHelperOptions {
  readonly type: 'both';
  readonly overwrite: boolean;
}

export type BindFunctionObjectThisHelperOptions = BindSingleFunctionHelperOptions | BindBothFunctionHelperOptions;

// Input: [objectVal, this]
// Output: [objectVal]
export class BindFunctionObjectThisHelper extends Helper {
  private readonly property: InternalObjectProperty;
  private readonly both: boolean;
  private readonly overwrite: boolean;

  public constructor(options: BindFunctionObjectThisHelperOptions) {
    super();
    if (options.type === 'both') {
      this.property = InternalObjectProperty.Call;
      this.both = true;
    } else {
      this.property = options.property;
      this.both = false;
    }
    this.overwrite = options.overwrite;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [objectVal, this]
    sb.emitHelper(
      node,
      options,
      sb.helpers.cloneFunctionObject(this.both ? { type: 'both' } : { type: 'single', property: this.property }),
    );
    // [this, objectVal]
    sb.emitOp(node, 'SWAP');

    if (this.both) {
      this.bindThis(sb, node, options, InternalObjectProperty.Call);
      this.bindThis(sb, node, options, InternalObjectProperty.Construct);
    } else {
      this.bindThis(sb, node, options, this.property);
    }

    sb.emitOp(node, 'DROP');
  }

  private bindThis(sb: ScriptBuilder, node: ts.Node, options: VisitOptions, property: InternalObjectProperty): void {
    // [this, objectVal, this]
    sb.emitOp(node, 'TUCK');
    // [objectVal, this, objectVal, this]
    sb.emitOp(node, 'OVER');
    // [property, objectVal, this, objectVal, this]
    sb.emitPushInt(node, property);
    // [func, this, objectVal, this]
    sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
    // [func, objectVal, this]
    sb.emitHelper(node, options, sb.helpers.bindFunctionThis({ overwrite: this.overwrite }));
    // [objectVal, this]
    sb.emitOp(node, 'DROP');
    // [this, objectVal]
    sb.emitOp(node, 'SWAP');
  }
}
