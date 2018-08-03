import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ForInStatementCompiler extends NodeCompiler<ts.ForInStatement> {
  public readonly kind = ts.SyntaxKind.ForInStatement;

  public visitNode(sb: ScriptBuilder, node: ts.ForInStatement, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const initializer = tsUtils.statement.getInitializer(node);
    if (!ts.isVariableDeclarationList(initializer)) {
      /* istanbul ignore next */
      sb.reportUnsupported(initializer);

      /* istanbul ignore next */
      return;
    }

    const variables = tsUtils.variable.getDeclarations(initializer);
    if (variables.length !== 1) {
      /* istanbul ignore next */
      sb.reportUnsupported(initializer);

      /* istanbul ignore next */
      return;
    }

    const variable = variables[0];
    const expression = tsUtils.expression.getExpression(node);
    const statement = tsUtils.statement.getStatement(node);
    const expressionType = sb.getType(expression);

    const handleArray = () => {
      // [arr]
      sb.emitHelper(expression, options, sb.helpers.unwrapArray);
      // []
      sb.emitHelper(
        node,
        options,
        sb.helpers.arrForEach({
          withIndex: true,
          each: (innerOptions) => {
            // [idx]
            sb.emitOp(variable, 'DROP');
            // [val]
            sb.emitHelper(variable, options, sb.helpers.createNumber);
            // [val]
            sb.emitHelper(variable, options, sb.helpers.toString({ type: undefined }));
            // [val]
            sb.emitHelper(variable, options, sb.helpers.createString);
            // []
            sb.visit(variable, sb.setValueOptions(innerOptions));
            // []
            sb.visit(statement, sb.noPushValueOptions(innerOptions));
          },
        }),
      );
    };

    const handleObject = () => {
      // [arr]
      sb.emitHelper(node, options, sb.helpers.getPropertyObjectKeys);
      // []
      sb.emitHelper(
        node,
        options,
        sb.helpers.arrForEach({
          withIndex: false,
          each: (innerOptions) => {
            // [stringVal]
            sb.emitHelper(variable, sb.pushValueOptions(innerOptions), sb.helpers.createString);
            // []
            sb.visit(variable, sb.setValueOptions(sb.noPushValueOptions(innerOptions)));
            // []
            sb.visit(statement, sb.noPushValueOptions(innerOptions));
          },
        }),
      );
    };

    // [objectVal]
    sb.visit(expression, options);
    if (
      expressionType === undefined ||
      (tsUtils.type_.hasArrayish(expressionType) && !tsUtils.type_.isOnlyArrayish(expressionType))
    ) {
      sb.emitHelper(
        expression,
        options,
        sb.helpers.if({
          condition: () => {
            // [objectVal, objectVal]
            sb.emitOp(expression, 'DUP');
            // [boolean]
            sb.emitHelper(expression, options, sb.helpers.isArray);
          },
          whenTrue: handleArray,
          whenFalse: handleObject,
        }),
      );
    } else if (tsUtils.type_.isOnlyArrayish(expressionType)) {
      handleArray();
    } else {
      handleObject();
    }
  }
}
