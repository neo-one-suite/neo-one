import {
  Node,
  SignaturedDeclaration,
  StatementedNode,
  TypeGuards,
  BodiedNode,
  BodyableNode,
} from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: []
// Output: [farr]
export class CreateCallArrayHelper extends Helper<
  Node & StatementedNode & SignaturedDeclaration & (BodiedNode | BodyableNode)
> {
  public emit(
    sb: ScriptBuilder,
    node: Node &
      StatementedNode &
      SignaturedDeclaration &
      (BodiedNode | BodyableNode),
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
            let body;
            if (TypeGuards.isBodyableNode(node)) {
              body = node.getBodyOrThrow();
            } else {
              body = node.getBody();
            }
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
