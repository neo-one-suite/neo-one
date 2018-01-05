import { Node, TypeGuards } from 'ts-simple-ast';

import { DiagnosticCode } from '../../../DiagnosticCode';
import { ScriptBuilder } from '../../sb';
import { Helper } from '../Helper';
import { VisitOptions } from '../../types';

import * as constants from '../../../constants';

const isValidParent = (node?: Node) =>
  node != null &&
  (TypeGuards.isTryStatement(node) ||
    TypeGuards.isFunctionLikeDeclaration(node) ||
    TypeGuards.isArrowFunction(node) ||
    TypeGuards.isSourceFile(node));

// Input: [completion]
// Output: []
export class HandleCompletionHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [completion, completion]
          sb.emitOp(node, 'DUP');
          // [errorVal, completion]
          sb.emitHelper(node, options, sb.helpers.getCompletionError);
          // [isUndefined, completion]
          sb.emitHelper(node, options, sb.helpers.isUndefined);
        },
        whenTrue: () => {
          sb.emitOp(node, 'DROP');
        },
        whenFalse: () => {
          let parent = node.getParent();
          if (!isValidParent(parent)) {
            parent = node.getParentWhile(
              (parentNode) => !isValidParent(parentNode),
            );
            if (parent != null) {
              parent = parent.getParent();
            }
          }

          if (
            TypeGuards.isSourceFile(node) ||
            (parent != null && TypeGuards.isSourceFile(parent))
          ) {
            // TODO: Add Error notification
            sb.emitOp(node, 'THROW');
          } else if (parent == null) {
            sb.reportError(
              node,
              'Something went wrong, could not find a valid parent node.',
              DiagnosticCode.SOMETHING_WENT_WRONG,
            );
          } else if (TypeGuards.isTryStatement(parent)) {
            if (options.catchPC == null) {
              sb.reportError(
                node,
                'Something went wrong. Expected a catch jump location.',
                DiagnosticCode.SOMETHING_WENT_WRONG,
              );
            } else {
              sb.emitPushInt(node, constants.CATCH_COMPLETION);
              sb.emitJmp(node, 'JMP', options.catchPC);
            }
          } else {
            sb.emitOp(node, 'RET');
          }
        },
      }),
    );
  }
}
