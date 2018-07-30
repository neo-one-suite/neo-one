import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

import { DiagnosticCode } from '../../../DiagnosticCode';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

import * as constants from '../../../constants';

const isValidParent = (node?: ts.Node) =>
  node !== undefined &&
  (ts.isTryStatement(node) ||
    tsUtils.guards.isFunctionLikeDeclarationBase(node) ||
    ts.isArrowFunction(node) ||
    ts.isSourceFile(node));

// Input: [completion]
// Output: []
export class HandleCompletionHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
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
          let parent = tsUtils.node.getParent(node) as ts.Node | undefined;
          // tslint:disable-next-line no-loop-statement
          while (parent !== undefined && !isValidParent(parent)) {
            parent = tsUtils.node.getParent(parent);
          }

          // [number]
          sb.emitLine(node);
          // ['trace', number]
          sb.emitPushString(node, 'trace');
          // [2, 'trace', number]
          sb.emitPushInt(node, 2);
          // [array]
          sb.emitOp(node, 'PACK');
          // []
          sb.emitSysCall(node, 'Neo.Runtime.Notify');
          if (ts.isSourceFile(node) || (parent !== undefined && ts.isSourceFile(parent))) {
            sb.emitOp(node, 'THROW');
          } else if (parent === undefined) {
            sb.reportError(
              node,
              'Something went wrong, could not find a valid parent node.',
              DiagnosticCode.SOMETHING_WENT_WRONG,
            );
          } else if (ts.isTryStatement(parent)) {
            if (options.catchPC === undefined) {
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
