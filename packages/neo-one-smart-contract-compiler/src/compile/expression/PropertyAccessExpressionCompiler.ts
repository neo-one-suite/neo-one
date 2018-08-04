import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../DiagnosticCode';
import { DiagnosticMessage } from '../../DiagnosticMessage';
import { isBuiltInMemberValue } from '../builtins';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class PropertyAccessExpressionCompiler extends NodeCompiler<ts.PropertyAccessExpression> {
  public readonly kind = ts.SyntaxKind.PropertyAccessExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.PropertyAccessExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(sb.noSetValueOptions(optionsIn));
    const symbol = sb.getSymbol(expr);
    const expression = tsUtils.expression.getExpression(expr);
    const name = tsUtils.node.getName(expr);

    if (symbol !== undefined) {
      const builtin = sb.builtIns.get(symbol);
      if (builtin !== undefined) {
        if (!isBuiltInMemberValue(builtin)) {
          sb.reportError(
            expr,
            DiagnosticCode.InvalidBuiltinReference,
            DiagnosticMessage.CannotReferenceBuiltinProperty,
          );

          return;
        }

        builtin.emitValue(sb, expr, optionsIn);

        return;
      }
    }

    const throwTypeError = (innerOptions: VisitOptions) => {
      sb.emitOp(expression, 'DROP');
      sb.emitHelper(expression, innerOptions, sb.helpers.throwTypeError);
    };

    const createProcessBuiltIn = (builtInSymbol: ts.Symbol) => () => {
      const member = tsUtils.symbol.getMember(builtInSymbol, name);
      if (member === undefined) {
        /* istanbul ignore next */
        sb.reportUnsupported(expr);

        /* istanbul ignore next */
        return;
      }

      const builtin = sb.builtIns.get(member);
      if (builtin === undefined) {
        /* istanbul ignore next */
        sb.reportUnsupported(expr);

        /* istanbul ignore next */
        return;
      }

      if (!isBuiltInMemberValue(builtin)) {
        sb.reportError(expr, DiagnosticCode.InvalidBuiltinReference, DiagnosticMessage.CannotReferenceBuiltinProperty);

        return;
      }

      builtin.emitValue(sb, expr, optionsIn, true);
    };

    const processObject = (innerOptions: VisitOptions) => {
      sb.emitPushString(tsUtils.node.getNameNode(expr), name);
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
      } else if (optionsIn.pushValue) {
        // [val]
        sb.emitHelper(expr, innerOptions, sb.helpers.getPropertyObjectProperty);
      } else if (optionsIn.setValue) {
        // [val, string, objectVal]
        sb.emitOp(expr, 'ROT');
        // []
        sb.emitHelper(expr, innerOptions, sb.helpers.setPropertyObjectProperty);
      }
    };

    // [val]
    sb.visit(expression, options);
    sb.emitHelper(
      expression,
      options,
      sb.helpers.forBuiltInType({
        type: sb.getType(expression),
        array: createProcessBuiltIn(sb.builtInSymbols.array),
        boolean: createProcessBuiltIn(sb.builtInSymbols.boolean),
        buffer: createProcessBuiltIn(sb.builtInSymbols.buffer),
        null: throwTypeError,
        number: createProcessBuiltIn(sb.builtInSymbols.number),
        object: processObject,
        string: createProcessBuiltIn(sb.builtInSymbols.string),
        symbol: createProcessBuiltIn(sb.builtInSymbols.symbol),
        undefined: throwTypeError,
      }),
    );
  }
}
