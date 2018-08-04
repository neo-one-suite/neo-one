import stringify from 'safe-stable-stringify';
import ts from 'typescript';
import { InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface GetCallableHelperOptions {
  readonly bindThis?: boolean;
  readonly overwriteThis?: boolean;
}

// Input: [objectVal, ?thisVal]
// Output: [callable]
export class GetCallableHelper extends Helper {
  public static getKey(options: GetCallableHelperOptions = { bindThis: false }): string {
    const bindThis = options.bindThis || false;
    const overwriteThis = options.overwriteThis || false;

    return stringify({ bindThis, overwriteThis });
  }

  private readonly bindThis: boolean;
  private readonly overwriteThis: boolean;

  public constructor(options: GetCallableHelperOptions = { bindThis: false }) {
    super();
    this.bindThis = options.bindThis || false;
    this.overwriteThis = options.overwriteThis || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // ['call', objectVal, ?thisVal]
    sb.emitPushInt(node, InternalObjectProperty.Call);
    // [func, ?thisVal]
    sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
    if (this.bindThis) {
      // [func]
      sb.emitHelper(node, options, sb.helpers.bindFunctionThis({ overwrite: this.overwriteThis }));
    }
  }
}
