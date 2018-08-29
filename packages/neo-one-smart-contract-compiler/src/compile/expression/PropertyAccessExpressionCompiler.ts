import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../DiagnosticCode';
import { DiagnosticMessage } from '../../DiagnosticMessage';
import { Builtin, isBuiltinInstanceMemberValue, isBuiltinMemberValue } from '../builtins';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class PropertyAccessExpressionCompiler extends NodeCompiler<ts.PropertyAccessExpression> {
  public readonly kind = ts.SyntaxKind.PropertyAccessExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.PropertyAccessExpression, optionsIn: VisitOptions): void {
    const value = tsUtils.expression.getExpression(expr);
    const valueType = sb.context.analysis.getType(value);
    const name = tsUtils.node.getNameNode(expr);
    const nameValue = tsUtils.node.getName(expr);

    const handleBuiltin = (member: Builtin, visited: boolean) => {
      if (isBuiltinInstanceMemberValue(member)) {
        member.emitValue(sb, expr, optionsIn, visited);

        return;
      }

      if (isBuiltinMemberValue(member)) {
        member.emitValue(sb, expr, optionsIn);

        return;
      }

      sb.context.reportError(
        expr,
        DiagnosticCode.InvalidBuiltinReference,
        DiagnosticMessage.CannotReferenceBuiltinProperty,
      );
    };

    const builtin = sb.context.builtins.getMember(value, name);
    if (builtin !== undefined) {
      handleBuiltin(builtin, false);

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
      const member = sb.context.builtins.getOnlyMember(valueName, nameValue);

      if (member === undefined) {
        return throwTypeError;
      }

      return () => {
        handleBuiltin(member, true);
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
        transaction: createProcessBuiltin('TransactionBase'),
        output: createProcessBuiltin('Output'),
        attribute: createProcessBuiltin('AttributeBase'),
        input: createProcessBuiltin('Input'),
        account: createProcessBuiltin('Account'),
        asset: createProcessBuiltin('Asset'),
        contract: createProcessBuiltin('Contract'),
        header: createProcessBuiltin('Header'),
        block: createProcessBuiltin('Block'),
      }),
    );
  }
}
