import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
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

    if (expressionType === undefined || !tsUtils.type_.isOnlyArrayish(expressionType)) {
      /* istanbul ignore next */
      sb.reportUnsupported(expression);

      /* istanbul ignore next */
      return;
    }

    // [objectVal]
    sb.visit(expression, options);
    // [arr]
    sb.emitHelper(expression, options, sb.helpers.unwrapArray);
    // []
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrForEach({
        withIndex: false,
        each: (innerOptions) => {
          // []
          sb.visit(variable, sb.setValueOptions(innerOptions));
          // []
          sb.visit(statement, sb.noPushValueOptions(innerOptions));
        },
      }),
    );
  }
}
