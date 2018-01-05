import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

export interface GetGlobalPropertyHelperOptions {
  property: string;
}

// Input: []
// Output: [val]
export class GetGlobalPropertyHelper extends Helper<Node> {
  private readonly property: string;

  constructor(options: GetGlobalPropertyHelperOptions) {
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
