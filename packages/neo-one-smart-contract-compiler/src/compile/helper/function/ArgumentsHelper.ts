import { ArgumentedNode, Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [argsArray]
export class ArgumentsHelper extends Helper<Node & ArgumentedNode> {
  public emit(
    sb: ScriptBuilder,
    node: Node & ArgumentedNode,
    options: VisitOptions,
  ): void {
    // Push the arguments
    const args = [...node.getArguments()].reverse();
    for (const arg of args) {
      sb.visit(arg, sb.pushValueOptions(options));
    }
    // [length, ...args]
    sb.emitPushInt(node, args.length);
    // [argsarr]
    sb.emitOp(node, 'PACK');
  }
}
