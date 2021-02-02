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
    const isOptionalChain = ts.isOptionalChain(expr);
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

      if (optionsIn.setValue) {
        sb.context.reportError(name, DiagnosticCode.InvalidBuiltinModify, DiagnosticMessage.CannotModifyBuiltin);
      } else {
        sb.context.reportError(
          name,
          DiagnosticCode.InvalidBuiltinReference,
          DiagnosticMessage.CannotReferenceBuiltinProperty,
        );
      }
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

    const processUndefined = (innerOptions: VisitOptions) => {
      // []
      sb.emitOp(expr, 'DROP');
      // [undefinedVal]
      sb.emitHelper(expr, innerOptions, sb.helpers.wrapUndefined);
    };

    const throwTypeErrorUnlessOptionalChain = (innerOptions: VisitOptions) => {
      isOptionalChain ? processUndefined(innerOptions) : throwTypeError(innerOptions);
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
        arrayStorage: createProcessBuiltin('ArrayStorage'),
        boolean: createProcessBuiltin('Boolean'),
        buffer: createProcessBuiltin('Buffer'),
        null: throwTypeErrorUnlessOptionalChain,
        number: createProcessBuiltin('Number'),
        object: processObject,
        string: createProcessBuiltin('String'),
        symbol: createProcessBuiltin('Symbol'),
        undefined: throwTypeErrorUnlessOptionalChain,
        map: createProcessBuiltin('Map'),
        mapStorage: createProcessBuiltin('MapStorage'),
        set: createProcessBuiltin('Set'),
        setStorage: createProcessBuiltin('SetStorage'),
        error: createProcessBuiltin('Error'),
        forwardValue: createProcessBuiltin('ForwardValue'),
        iteratorResult: createProcessBuiltin('IteratorResult'),
        iterable: createProcessBuiltin('Iterable'),
        iterableIterator: createProcessBuiltin('IterableIterator'),
        transaction: createProcessBuiltin('Transaction'),
        attribute: createProcessBuiltin('AttributeBase'),
        contract: createProcessBuiltin('Contract'),
        block: createProcessBuiltin('Block'),
      }),
    );
  }
}
