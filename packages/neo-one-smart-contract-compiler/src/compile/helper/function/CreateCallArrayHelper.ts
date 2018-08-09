import { BodiedNode, BodyableNode, ParameteredNode, tsUtils } from '@neo-one/ts-utils';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { handleReturnTypeAssignment } from '../types';

// Input: []
// Output: [farr]
export class CreateCallArrayHelper extends Helper<(BodiedNode | BodyableNode) & ParameteredNode> {
  public emit(
    sb: ScriptBuilder,
    node: (BodiedNode | BodyableNode) & ParameteredNode,
    outerOptions: VisitOptions,
  ): void {
    if (!outerOptions.pushValue) {
      return;
    }

    sb.emitHelper(
      node,
      outerOptions,
      sb.helpers.createFunctionArray({
        body: (innerOptions) => {
          sb.withScope(node, innerOptions, (options) => {
            sb.emitHelper(node, options, sb.helpers.parameters({ params: tsUtils.parametered.getParameters(node) }));
            const body = tsUtils.body.getBodyOrThrow(node);
            if (tsUtils.guards.isExpression(body)) {
              // [val]
              sb.visit(body, sb.pushValueOptions(options));
              handleReturnTypeAssignment(sb.context, body);
              // []
              sb.emitHelper(node, options, sb.helpers.return);
            } else {
              sb.visit(body, options);
              // [undefinedVal]
              sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.wrapUndefined);
              // []
              sb.emitHelper(node, options, sb.helpers.return);
            }
          });
        },
      }),
    );
  }
}
