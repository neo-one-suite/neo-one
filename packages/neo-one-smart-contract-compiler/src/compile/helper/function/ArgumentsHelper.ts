import { ArgumentedNode, tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [argsArray]
export class ArgumentsHelper extends Helper<ArgumentedNode> {
  public emit(sb: ScriptBuilder, node: ArgumentedNode, options: VisitOptions): void {
    // Push the arguments
    const args = _.reverse([...tsUtils.argumented.getArguments(node)]);
    args.forEach((arg) => {
      sb.visit(arg, sb.pushValueOptions(options));
    });
    // [length, ...args]
    sb.emitPushInt(node, args.length);
    // [argsarr]
    sb.emitOp(node, 'PACK');
  }
}
