import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import ts from 'typescript';
import { DiagnosticCode } from '../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../DiagnosticMessage';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { getHasBuiltins } from '../types';

// Input: []
// Output: [argsArray]
export class ArgumentsHelper extends Helper<ts.CallExpression | ts.NewExpression> {
  public emit(sb: ScriptBuilder, node: ts.CallExpression | ts.NewExpression, options: VisitOptions): void {
    const args = tsUtils.argumented.getArgumentsArray(node);
    if (args.length > 0) {
      const signatureTypes = sb.context.analysis.extractSignaturesForCall(node, { error: true });

      if (signatureTypes !== undefined) {
        args.forEach((arg, idx) => {
          const argType = sb.context.analysis.getType(arg);
          if (argType !== undefined) {
            const mismatch = signatureTypes.some(({ paramDecls, paramTypes }) => {
              const paramDecl = paramDecls[Math.min(idx, paramDecls.length - 1)];
              let paramTypeIn = paramTypes.get(paramDecl);
              if (paramTypeIn !== undefined && tsUtils.parameter.isRestParameter(paramDecl)) {
                paramTypeIn = tsUtils.type_.getArrayType(paramTypeIn);
              }
              const paramType = paramTypeIn;
              const hasBuiltins = getHasBuiltins(sb.context, arg, argType);

              return (
                paramType === undefined ||
                hasBuiltins.some((hasBuiltin) => !hasBuiltin(sb.context, paramDecl, paramType))
              );
            });

            if (mismatch) {
              sb.context.reportError(
                arg,
                DiagnosticCode.InvalidBuiltinUsage,
                DiagnosticMessage.InvalidBuiltinCallArgument,
              );
            }
          }
        });
      }
    }

    // Push the arguments
    _.reverse([...args]).forEach((arg) => {
      sb.visit(arg, sb.pushValueOptions(options));
    });
    // [length, ...args]
    sb.emitPushInt(node, args.length);
    // [argsarr]
    sb.emitOp(node, 'PACK');
  }
}
