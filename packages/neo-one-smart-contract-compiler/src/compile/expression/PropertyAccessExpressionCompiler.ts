import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../DiagnosticCode';
import { DiagnosticMessage } from '../../DiagnosticMessage';
import { isBuiltinMemberValue } from '../builtins';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class PropertyAccessExpressionCompiler extends NodeCompiler<ts.PropertyAccessExpression> {
  public readonly kind = ts.SyntaxKind.PropertyAccessExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.PropertyAccessExpression, optionsIn: VisitOptions): void {
    const value = tsUtils.expression.getExpression(expr);
    const valueType = sb.getType(value);
    const name = tsUtils.node.getNameNode(expr);
    const nameValue = tsUtils.node.getName(expr);

    const builtin = sb.builtins.getMember(sb.context, value, name);
    if (builtin !== undefined) {
      if (!isBuiltinMemberValue(builtin)) {
        sb.reportError(expr, DiagnosticCode.InvalidBuiltinReference, DiagnosticMessage.CannotReferenceBuiltinProperty);

        return;
      }

      builtin.emitValue(sb, expr, optionsIn);

      return;
    }

    const throwTypeError = (innerOptions: VisitOptions) => {
      // []
      /* istanbul ignore next */
      sb.emitOp(expr, 'DROP');
      /* istanbul ignore next */
      sb.emitHelper(expr, innerOptions, sb.helpers.throwTypeError);
    };

    const createProcessBuiltin = (valueName: string) => {
      const member = sb.builtins.getOnlyMember(sb.context, valueName, nameValue);

      if (member === undefined) {
        return throwTypeError;
      }

      return () => {
        if (!isBuiltinMemberValue(member)) {
          /* istanbul ignore next */
          sb.reportError(
            expr,
            DiagnosticCode.InvalidBuiltinReference,
            DiagnosticMessage.CannotReferenceBuiltinProperty,
          );

          /* istanbul ignore next */
          return;
        }

        member.emitValue(sb, expr, optionsIn, true);
      };
    };

    const processObject = (innerOptions: VisitOptions) => {
      sb.emitPushString(name, nameValue);
      if (optionsIn.pushValue && optionsIn.setValue) {
        // [objectVal, string, objectVal, val]
        sb.emitOp(expr, 'OVER');
        // [string, objectVal, string, objectVal, val]
        sb.emitOp(expr, 'OVER');
        // [number, string, objectVal, string, objectVal, val]
        sb.emitPushInt(expr, 4);
        // [val, string, objectVal, string, objectVal]
        sb.emitOp(expr, 'ROLL');
        // [string, objectVal]
        sb.emitHelper(expr, innerOptions, sb.helpers.setPropertyObjectProperty);
        // [val]
        sb.emitHelper(expr, innerOptions, sb.helpers.getPropertyObjectProperty);
      } else if (optionsIn.setValue) {
        // [val, string, objectVal]
        sb.emitOp(expr, 'ROT');
        // []
        sb.emitHelper(expr, innerOptions, sb.helpers.setPropertyObjectProperty);
      } else {
        // Handle getter side effects
        // [val]
        sb.emitHelper(expr, innerOptions, sb.helpers.getPropertyObjectProperty);

        if (!optionsIn.pushValue) {
          // []
          sb.emitOp(expr, 'DROP');
        }
      }
    };

    const options = sb.pushValueOptions(sb.noSetValueOptions(optionsIn));
    // [val]
    sb.visit(value, options);
    sb.emitHelper(
      value,
      options,
      sb.helpers.forBuiltinType({
        type: valueType,
        array: createProcessBuiltin('Array'),
        boolean: createProcessBuiltin('Boolean'),
        buffer: createProcessBuiltin('Buffer'),
        null: throwTypeError,
        number: createProcessBuiltin('Number'),
        object: processObject,
        string: createProcessBuiltin('String'),
        symbol: createProcessBuiltin('Symbol'),
        undefined: throwTypeError,
      }),
    );
  }
}
