import { BodiedNode, BodyableNode, tsUtils } from '@neo-one/ts-utils';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [farr]
export class CreateCallArrayHelper extends Helper<BodiedNode | BodyableNode> {
  public emit(sb: ScriptBuilder, node: BodiedNode | BodyableNode, outerOptions: VisitOptions): void {
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
            const body = tsUtils.body.getBodyOrThrow(node);
            if (tsUtils.guards.isExpression(body)) {
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
