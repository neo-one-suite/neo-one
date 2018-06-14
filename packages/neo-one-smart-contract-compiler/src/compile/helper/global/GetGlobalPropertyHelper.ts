import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface GetGlobalPropertyHelperOptions {
  readonly property: string;
}

// Input: []
// Output: [val]
export class GetGlobalPropertyHelper extends Helper {
  private readonly property: string;

  public constructor(options: GetGlobalPropertyHelperOptions) {
    super();
    this.property = options.property;
  }

  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [globalObjectVal]
    sb.scope.getGlobal(sb, node, options);
    // [propertyString, globalObjectVal]
    sb.emitPushString(node, this.property);
    // [val]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
