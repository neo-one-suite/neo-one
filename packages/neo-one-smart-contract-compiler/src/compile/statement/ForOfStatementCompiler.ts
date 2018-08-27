import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ArrayEntries } from '../builtins/array/entries';
import { WellKnownSymbol } from '../constants';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ForOfStatementCompiler extends NodeCompiler<ts.ForOfStatement> {
  public readonly kind = ts.SyntaxKind.ForOfStatement;

  public visitNode(sb: ScriptBuilder, node: ts.ForOfStatement, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const initializer = tsUtils.statement.getInitializer(node);
    if (!ts.isVariableDeclarationList(initializer)) {
      /* istanbul ignore next */
      sb.context.reportUnsupported(initializer);

      /* istanbul ignore next */
      return;
    }

    const variables = tsUtils.variable.getDeclarations(initializer);
    if (variables.length !== 1) {
      /* istanbul ignore next */
      sb.context.reportUnsupported(initializer);

      /* istanbul ignore next */
      return;
    }

    const variable = variables[0];
    const nameNode = tsUtils.node.getNameNode(variable);
    const variableType = sb.context.getType(nameNode, { warning: true });
    const expression = tsUtils.expression.getExpression(node);
    const statement = tsUtils.statement.getStatement(node);
    const expressionType = sb.context.getType(expression, { warning: true });

    const each = (innerOptions: VisitOptions) => {
      if (ts.isIdentifier(nameNode)) {
        sb.scope.add(tsUtils.node.getText(nameNode));
        sb.scope.set(sb, node, innerOptions, tsUtils.node.getText(nameNode));
      } else if (ts.isArrayBindingPattern(nameNode)) {
        sb.emitHelper(nameNode, innerOptions, sb.helpers.arrayBinding({ type: variableType }));
      } else {
        sb.emitHelper(nameNode, innerOptions, sb.helpers.objectBinding({ type: variableType }));
      }
      sb.visit(statement, sb.noPushValueOptions(innerOptions));
    };

    const handleOther = (innerOptions: VisitOptions) => {
      // [objectVal]
      sb.emitHelper(expression, innerOptions, sb.helpers.toObject({ type: expressionType }));
      // [objectVal, objectVal]
      sb.emitOp(expression, 'DUP');
      // [string, objectVal, objectVal]
      sb.emitPushString(expression, WellKnownSymbol.iterator);
      // [objectVal, objectVal]
      sb.emitHelper(expression, innerOptions, sb.helpers.getSymbolObjectProperty);
      // [objectVal]
      sb.emitHelper(expression, innerOptions, sb.helpers.invokeCall({ bindThis: true, noArgs: true }));
      // []
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.iteratorForEach({
          each,
        }),
      );
    };

    const handleArray = (innerOptions: VisitOptions, withIndex = false, arrEach = each) => {
      // [arr]
      sb.emitHelper(expression, innerOptions, sb.helpers.unwrapArray);
      // []
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.arrForEach({
          withIndex,
          each: arrEach,
        }),
      );
    };

    if (ts.isCallExpression(expression)) {
      const valueExpression = tsUtils.expression.getExpression(expression);
      if (ts.isPropertyAccessExpression(valueExpression)) {
        const value = tsUtils.expression.getExpression(valueExpression);
        const name = tsUtils.node.getNameNode(valueExpression);

        const builtinProp = sb.context.builtins.getMember(value, name);
        if (builtinProp !== undefined && builtinProp instanceof ArrayEntries) {
          // [val]
          sb.visit(value, options);
          handleArray(options, true, (innerOptions) => {
            // [idx, val]
            sb.emitOp(variable, 'SWAP');
            // [idxVal, val]
            sb.emitHelper(variable, sb.pushValueOptions(innerOptions), sb.helpers.wrapNumber);
            // [2, idxVal, val]
            sb.emitPushInt(variable, 2);
            // [arr]
            sb.emitOp(variable, 'PACK');
            // [arrayVal]
            sb.emitHelper(variable, sb.pushValueOptions(innerOptions), sb.helpers.wrapArray);
            // []
            each(innerOptions);
          });

          return;
        }
      }
    }

    // [val]
    sb.visit(expression, options);
    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: sb.context.getType(expression, { warning: true }),
        array: handleArray,
        boolean: handleOther,
        buffer: handleOther,
        null: handleOther,
        number: handleOther,
        object: handleOther,
        string: handleOther,
        symbol: handleOther,
        undefined: handleOther,
        transaction: handleOther,
        output: handleOther,
        attribute: handleOther,
        input: handleOther,
        account: handleOther,
        asset: handleOther,
        contract: handleOther,
        header: handleOther,
        block: handleOther,
      }),
    );
  }
}
