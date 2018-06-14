import { BodiedNode, BodyableNode, Node, SignaturedDeclaration, StatementedNode, TypeGuards } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [farr]
export class CreateCallArrayHelper extends Helper<
  Node & StatementedNode & SignaturedDeclaration & (BodiedNode | BodyableNode)
> {
  public emit(
    sb: ScriptBuilder,
    node: Node & StatementedNode & SignaturedDeclaration & (BodiedNode | BodyableNode),
    outerOptions: VisitOptions,
  ): void {
    if (!outerOptions.pushValue) {
      return;
    }

    sb.emitHelper(
      node,
      outerOptions,
      sb.helpers.createFunctionArray({
        body: () => {
          sb.withScope(node, outerOptions, (options) => {
            sb.emitHelper(node, options, sb.helpers.parameters);
            const body = TypeGuards.isBodyableNode(node) ? node.getBodyOrThrow() : node.getBody();
            if (TypeGuards.isExpression(body)) {
              // [val]
              sb.visit(body, options);
              // [completion]
              sb.emitHelper(node, options, sb.helpers.createNormalCompletion);
              // [completion]
              sb.emitOp(node, 'RET');
            } else {
              sb.visit(body, options);
              // [undefinedVal]
              sb.emitHelper(node, options, sb.helpers.createUndefined);
              // [completion]
              sb.emitHelper(node, options, sb.helpers.createNormalCompletion);
              // [completion]
              sb.emitOp(node, 'RET');
            }
          });
        },
      }),
    );
  }
}
