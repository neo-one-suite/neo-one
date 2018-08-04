import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface GetGlobalPropertyHelperOptions {
  readonly property: GlobalProperty;
}

// Input: []
// Output: [val]
export class GetGlobalPropertyHelper extends Helper {
  private readonly property: GlobalProperty;

  public constructor(options: GetGlobalPropertyHelperOptions) {
    super();
    this.property = options.property;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      return;
    }

    // [globalObject]
    sb.scope.getGlobal(sb, node, options);
    // [number, globalObject]
    sb.emitPushInt(node, this.property);
    // [val]
    sb.emitOp(node, 'PICKITEM');
  }
}
